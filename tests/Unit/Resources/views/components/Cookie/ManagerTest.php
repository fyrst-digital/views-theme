<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Cookie;

use Fyrst\ViewsTheme\Resources\views\components\Cookie\Manager;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Content\Cookie\Struct\CookieEntry;
use Shopware\Core\Content\Cookie\Struct\CookieEntryCollection;
use Shopware\Core\Content\Cookie\Struct\CookieGroup;
use Shopware\Core\Content\Cookie\Struct\CookieGroupCollection;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;

final class ManagerTest extends TestCase
{
    public function testHiddenEntriesAreDropped(): void
    {
        $hidden = new CookieEntry('cookie-preference');
        $hidden->hidden = true;

        $visible = new CookieEntry('session-');
        $visible->name = 'Session';

        $group = new CookieGroup('cookie.groupRequired');
        $group->name = 'Technically required';
        $group->isRequired = true;
        $group->setEntries(new CookieEntryCollection([$hidden, $visible]));

        $views = $this->mount([$group])->views;

        self::assertCount(1, $views);
        self::assertTrue($views[0]->required);
        self::assertSame('vi-cookie-group-cookie-groupRequired', $views[0]->id);
        self::assertCount(1, $views[0]->entries);
        self::assertSame('session-', $views[0]->entries[0]->cookie);
        self::assertSame('Session', $views[0]->entries[0]->name);
        self::assertSame('vi-cookie-session', $views[0]->entries[0]->id);
    }

    public function testEntryFallsBackToCookieNameAndSkipsEmptyDescription(): void
    {
        $entry = new CookieEntry('youtube video');
        $entry->description = '';

        $group = new CookieGroup('comfort');
        $group->name = 'Comfort';
        $group->description = 'Nice to have';
        $group->setEntries(new CookieEntryCollection([$entry]));

        $view = $this->mount([$group])->views[0];

        self::assertSame('Nice to have', $view->description);
        self::assertSame('youtube video', $view->entries[0]->name);
        self::assertNull($view->entries[0]->description);
        self::assertSame('vi-cookie-youtube-video', $view->entries[0]->id);
    }

    public function testGroupThatIsACookieItself(): void
    {
        $group = new CookieGroup('single');
        $group->name = 'Single';
        $group->setCookie('single-cookie');

        $view = $this->mount([$group])->views[0];

        self::assertSame([], $view->entries);
        self::assertSame('single-cookie', $view->cookie);
    }

    public function testGroupsWithoutVisibleCookiesAreSkipped(): void
    {
        $hidden = new CookieEntry('cookie-config-hash');
        $hidden->hidden = true;

        $group = new CookieGroup('empty');
        $group->name = 'Empty';
        $group->setEntries(new CookieEntryCollection([$hidden]));

        self::assertSame([], $this->mount(new CookieGroupCollection([$group]))->views);
    }

    public function testDefaultsComeFromSystemConfig(): void
    {
        $component = $this->mount([], ['core.basicInformation.acceptAllCookies' => true, 'core.basicInformation.privacyPage' => 'abc']);

        self::assertTrue($component->acceptAll);
        self::assertSame('abc', $component->privacyPageId);
    }

    public function testExplicitPropsWinOverSystemConfig(): void
    {
        $component = $this->mount([], ['core.basicInformation.acceptAllCookies' => true, 'core.basicInformation.privacyPage' => 'abc'], false, 'own');

        self::assertFalse($component->acceptAll);
        self::assertSame('own', $component->privacyPageId);
    }

    /**
     * @param iterable<CookieGroup> $groups
     * @param array<string, mixed> $config
     */
    private function mount(iterable $groups, array $config = [], ?bool $acceptAll = null, ?string $privacyPageId = null): Manager
    {
        $systemConfig = $this->createStub(SystemConfigService::class);
        $systemConfig->method('get')->willReturnCallback(static fn (string $key): mixed => $config[$key] ?? null);

        $component = new Manager($systemConfig, new SalesChannelContextAccessor(new RequestStack()));
        $component->groups = $groups;
        $component->acceptAll = $acceptAll;
        $component->privacyPageId = $privacyPageId;
        $component->postMount([]);

        return $component;
    }
}
