<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Resources\views\components\Cookie;

use Webflare\ViewsTheme\Service\SalesChannelContextAccessor;
use Webflare\ViewsTheme\Struct\CookieEntryView;
use Webflare\ViewsTheme\Struct\CookieGroupView;
use Shopware\Core\Content\Cookie\Struct\CookieGroup;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Cookie:Manager — turns core cookie groups into switchable group/entry views.
 */
#[AsTwigComponent]
class Manager
{
    /**
     * Core cookie groups (`CookieGroupCollection`).
     *
     * @var iterable<CookieGroup>
     */
    public iterable $groups = [];

    /**
     * Offer "accept all"; null = `core.basicInformation.acceptAllCookies`.
     */
    public ?bool $acceptAll = null;

    /**
     * Privacy CMS page id for the intro text link; null = `core.basicInformation.privacyPage`.
     */
    public ?string $privacyPageId = null;

    /**
     * @var list<CookieGroupView>
     */
    public array $views = [];

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();

        $this->acceptAll ??= (bool) $this->systemConfigService->get('core.basicInformation.acceptAllCookies', $salesChannelId);

        if ($this->privacyPageId === null) {
            $privacyPage = $this->systemConfigService->get('core.basicInformation.privacyPage', $salesChannelId);
            $this->privacyPageId = \is_string($privacyPage) && $privacyPage !== '' ? $privacyPage : null;
        }

        $this->views = [];
        foreach ($this->groups as $group) {
            if (!$group instanceof CookieGroup) {
                continue;
            }

            $view = $this->view($group);
            if ($view !== null) {
                $this->views[] = $view;
            }
        }
    }

    private function view(CookieGroup $group): ?CookieGroupView
    {
        $entries = [];
        foreach ($group->getEntries() ?? [] as $entry) {
            if ($entry->hidden || $entry->cookie === '') {
                continue;
            }

            $entries[] = new CookieEntryView(
                'vi-cookie-' . self::slug($entry->cookie),
                $entry->cookie,
                isset($entry->name) && $entry->name !== '' ? $entry->name : $entry->cookie,
                isset($entry->description) && $entry->description !== '' ? $entry->description : null,
            );
        }

        $cookie = $group->getCookie();
        if ($entries === [] && ($cookie === null || $cookie === '')) {
            return null;
        }

        return new CookieGroupView(
            'vi-cookie-group-' . self::slug($group->getTechnicalName()),
            $group->name,
            $group->isRequired,
            $entries,
            isset($group->description) && $group->description !== '' ? $group->description : null,
            $entries === [] ? $cookie : null,
        );
    }

    private static function slug(string $value): string
    {
        return trim((string) preg_replace('/[^A-Za-z0-9_-]+/', '-', $value), '-');
    }
}
