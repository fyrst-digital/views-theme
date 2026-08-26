<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Address;

use Fyrst\ViewsTheme\Resources\views\components\Address\Personal;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Symfony\Component\HttpFoundation\RequestStack;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\Translation\TranslatorInterface;

final class PersonalTest extends TestCase
{
    public function testProfileAlwaysShowsCompanyFieldsWhenAccountTypeIsHidden(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->showCompanyFields = true;
        $component->postMount([]);

        self::assertFalse($component->showAccountType);
        self::assertTrue($component->showCompany);
        self::assertFalse($component->companyAlways);
    }

    public function testCompanyFieldsStayHiddenWhenNotRequestedAndAccountTypeIsOff(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->postMount([]);

        self::assertFalse($component->showAccountType);
        self::assertFalse($component->showCompany);
    }

    public function testOnlyCompanyRegistrationForcesBusinessAndCompany(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->onlyCompanyRegistration = true;
        $component->postMount([]);

        self::assertTrue($component->showAccountType);
        self::assertTrue($component->companyAlways);
        self::assertTrue($component->showCompany);
        self::assertSame(CustomerEntity::ACCOUNT_TYPE_BUSINESS, $component->accountTypeValue);
    }

    private function createComponent(bool $showAccountTypeSelection): Personal
    {
        $config = $this->createMock(SystemConfigService::class);
        $config->method('get')->willReturnCallback(
            static fn (string $key): mixed => $key === 'core.loginRegistration.showAccountTypeSelection'
                ? $showAccountTypeSelection
                : false,
        );

        return new Personal(
            $config,
            new SalesChannelContextAccessor(new RequestStack()),
            $this->createStub(TranslatorInterface::class),
            new RequestStack(),
        );
    }
}
