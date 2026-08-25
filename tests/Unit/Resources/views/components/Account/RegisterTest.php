<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Account;

use Fyrst\ViewsTheme\Resources\views\components\Account\Register;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;

final class RegisterTest extends TestCase
{
    #[DataProvider('createAccountCheckedProvider')]
    public function testCreateAccountChecked(
        mixed $data,
        bool $guestSelectable,
        int $createDefault,
        bool $expected,
    ): void {
        $component = $this->createComponent($createDefault);
        $component->data = $data;
        $component->guestSelectable = $guestSelectable;
        $component->postMount([]);

        self::assertSame($expected, $component->createAccountChecked);
    }

    /**
     * @return iterable<string, array{0: mixed, 1: bool, 2: int, 3: bool}>
     */
    public static function createAccountCheckedProvider(): iterable
    {
        yield 'empty bag guest config on' => [new DataBag(), true, 1, true];
        yield 'empty bag guest config off' => [new DataBag(), true, 0, false];
        yield 'null data guest config on' => [null, true, 1, true];
        yield 'repost guest omits key despite config on' => [new DataBag(['email' => 'a@b.c']), true, 1, false];
        yield 'repost create account true' => [new DataBag(['email' => 'a@b.c', 'createCustomerAccount' => 'true']), true, 0, true];
        yield 'repost create account 1' => [new DataBag(['email' => 'a@b.c', 'createCustomerAccount' => '1']), true, 0, true];
        yield 'account register ignores config off' => [new DataBag(), false, 0, true];
        yield 'account register ignores omitted key on filled bag' => [new DataBag(['email' => 'a@b.c']), false, 0, true];
    }

    private function createComponent(int $createDefault): Register
    {
        $config = $this->createMock(SystemConfigService::class);
        $config->method('get')->willReturnCallback(
            static fn (string $key): mixed => match ($key) {
                'core.loginRegistration.createCustomerAccountDefault' => $createDefault,
                'core.loginRegistration.passwordMinLength' => 0,
                default => false,
            }
        );

        return new Register(
            $config,
            new SalesChannelContextAccessor(new RequestStack()),
            $this->createStub(TranslatorInterface::class),
            new RequestStack(),
        );
    }
}
