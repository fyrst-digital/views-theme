<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Address;

use Fyrst\ViewsTheme\Resources\views\components\Address\Personal;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Twig\ViUtilities;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Symfony\Component\HttpFoundation\RequestStack;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\ComponentAttributes;
use Twig\Environment;
use Twig\Loader\FilesystemLoader;
use Twig\Runtime\EscaperRuntime;

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

    public function testDefaultOrderAndSpans(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->postMount([]);

        self::assertSame(
            ['prepend', 'accountType', 'salutation', 'title', 'firstName', 'lastName', 'birthday', 'append'],
            $component->order,
        );
        self::assertSame([
            'accountType' => 6,
            'accountTypeSelect' => 3,
            'salutation' => 3,
            'title' => 3,
            'firstName' => 3,
            'lastName' => 3,
            'birthday' => 6,
            'company' => 6,
        ], $component->spans);
    }

    public function testOrderReplacesDefaultAndDropsUnknownDuplicates(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->order = ['lastName', 'nope', 'firstName', 'firstName', 'append'];
        $component->postMount([]);

        self::assertSame(['lastName', 'firstName', 'append'], $component->order);
    }

    public function testEmptyOrderRendersNoSlots(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->order = [];
        $component->postMount([]);

        self::assertSame([], $component->order);
    }

    public function testSpansMergeAndRejectOutOfRange(): void
    {
        $component = $this->createComponent(showAccountTypeSelection: false);
        $component->spans = [
            'firstName' => 6,
            'lastName' => '12',
            'salutation' => 0,
            'title' => 13,
            'birthday' => 'nope',
            'unknown' => 4,
        ];
        $component->postMount([]);

        self::assertSame(6, $component->spans['firstName']);
        self::assertSame(12, $component->spans['lastName']);
        self::assertSame(3, $component->spans['salutation']);
        self::assertSame(3, $component->spans['title']);
        self::assertSame(6, $component->spans['birthday']);
        self::assertArrayNotHasKey('unknown', $component->spans);
    }

    public function testSpanVariantUsesCallerValue(): void
    {
        $html = $this->renderSlot('firstName', 6);

        self::assertSame('vi-address-personal__first-name g-col-6', $html);
    }

    public function testSpanVariantFallsBackToDefault(): void
    {
        $html = $this->renderSlot('salutation', null);

        self::assertSame('vi-address-personal__salutation g-col-3', $html);
    }

    private function renderSlot(string $slot, ?int $span): string
    {
        $views = dirname(__DIR__, 6) . '/src/Resources/views';
        $loader = new FilesystemLoader([], $views);
        $loader->addPath($views, 'ViewsTheme');
        $twig = new Environment($loader);
        $twig->addExtension(new ViUtilities());

        $recipe = $span === null ? '' : ', { span: span }';
        $template = $twig->createTemplate(
            '{% do vi_define_cva(cva, "@ViewsTheme/components/Address/Personal.cva.twig") %}{{ vi_class("' . $slot . '"' . $recipe . ') }}',
        );

        return $template->render([
            'cva' => [],
            'span' => $span,
            'attributes' => new ComponentAttributes([], $twig->getRuntime(EscaperRuntime::class)),
        ]);
    }

    private function createComponent(bool $showAccountTypeSelection): Personal
    {
        $config = $this->createStub(SystemConfigService::class);
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
