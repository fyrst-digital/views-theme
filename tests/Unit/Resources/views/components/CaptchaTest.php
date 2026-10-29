<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components;

use Fyrst\ViewsTheme\Resources\views\components\Captcha;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Struct\CaptchaEntry;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;

final class CaptchaTest extends TestCase
{
    public function testKeepsOnlyActiveCaptchasInConfigOrder(): void
    {
        $component = $this->mount([
            'honeypot' => ['name' => 'Honeypot', 'isActive' => true],
            'basicCaptcha' => ['name' => 'basicCaptcha', 'isActive' => false],
            'googleReCaptchaV3' => ['name' => 'googleReCaptchaV3', 'isActive' => true],
        ]);

        self::assertSame(
            ['honeypot', 'googleReCaptchaV3'],
            array_map(static fn (CaptchaEntry $entry): string => $entry->type, $component->captchas),
        );
    }

    /**
     * @param array<string, array<string, mixed>> $config
     */
    #[DataProvider('hiddenProvider')]
    public function testHiddenWithoutVisibleCaptcha(array $config, bool $expected): void
    {
        self::assertSame($expected, $this->mount($config)->hidden);
    }

    /**
     * @return iterable<string, array{0: array<string, array<string, mixed>>, 1: bool}>
     */
    public static function hiddenProvider(): iterable
    {
        yield 'none active' => [['basicCaptcha' => ['isActive' => false]], true];
        yield 'honeypot only' => [['honeypot' => ['isActive' => true]], true];
        yield 'basic captcha' => [['honeypot' => ['isActive' => true], 'basicCaptcha' => ['isActive' => true]], false];
        yield 'plugin captcha' => [['customCaptcha' => ['isActive' => true]], false];
    }

    public function testNonArrayConfigYieldsNoCaptchas(): void
    {
        $component = $this->mount(null);

        self::assertSame([], $component->captchas);
        self::assertTrue($component->hidden);
    }

    public function testFormIdIsPrefixed(): void
    {
        $component = $this->mount([], '42');
        self::assertSame('form-42', $component->captchaFormId);

        $generated = $this->mount([]);
        self::assertNotNull($generated->formId);
        self::assertSame('form-' . $generated->formId, $generated->captchaFormId);
    }

    /**
     * @param array<string, array<string, mixed>> $config
     */
    #[DataProvider('protectionProvider')]
    public function testGoogleV2Protection(array $config, bool $expected): void
    {
        $entry = $this->entry($this->mount($config), 'googleReCaptchaV2');

        self::assertSame($expected, $entry->props['protection']);
    }

    /**
     * @return iterable<string, array{0: array<string, array<string, mixed>>, 1: bool}>
     */
    public static function protectionProvider(): iterable
    {
        $v2 = static fn (bool $invisible): array => ['isActive' => true, 'config' => ['invisible' => $invisible]];

        yield 'visible v2' => [['googleReCaptchaV2' => $v2(false)], false];
        yield 'invisible v2 alone' => [['googleReCaptchaV2' => $v2(true)], true];
        yield 'invisible v2 with v3' => [['googleReCaptchaV2' => $v2(true), 'googleReCaptchaV3' => ['isActive' => true]], false];
    }

    public function testMapsTypesToComponents(): void
    {
        $component = $this->mount([
            'basicCaptcha' => ['isActive' => true],
            'honeypot' => ['isActive' => true],
            'googleReCaptchaV3' => ['isActive' => true, 'config' => ['siteKey' => 'SK3']],
            'customCaptcha' => ['isActive' => true],
        ], '42');

        $basic = $this->entry($component, 'basicCaptcha');
        self::assertSame('ViewsTheme:Captcha:Basic', $basic->component);
        self::assertSame(['formId' => 'form-42'], $basic->props);
        self::assertTrue($basic->visible);

        $honeypot = $this->entry($component, 'honeypot');
        self::assertSame('ViewsTheme:Captcha:Honeypot', $honeypot->component);
        self::assertFalse($honeypot->visible);

        $v3 = $this->entry($component, 'googleReCaptchaV3');
        self::assertSame('ViewsTheme:Captcha:GoogleReCaptchaV3', $v3->component);
        self::assertSame(['formId' => 'form-42', 'siteKey' => 'SK3'], $v3->props);

        $custom = $this->entry($component, 'customCaptcha');
        self::assertSame('ViewsTheme:Captcha:Legacy', $custom->component);
        self::assertSame('legacy', $custom->slot);
        self::assertSame(['type' => 'customCaptcha', 'formId' => 'form-42'], $custom->props);
    }

    private function entry(Captcha $component, string $type): CaptchaEntry
    {
        foreach ($component->captchas as $entry) {
            if ($entry->type === $type) {
                return $entry;
            }
        }

        self::fail('Missing captcha entry ' . $type);
    }

    private function mount(mixed $config, ?string $formId = null): Captcha
    {
        $systemConfig = $this->createStub(SystemConfigService::class);
        $systemConfig->method('get')->willReturn($config);

        $component = new Captcha($systemConfig, new SalesChannelContextAccessor(new RequestStack()));
        $component->formId = $formId;
        $component->postMount([]);

        return $component;
    }
}
