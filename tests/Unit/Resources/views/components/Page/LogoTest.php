<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Tests\Unit\Resources\views\components\Page;

use Webflare\ViewsTheme\Resources\views\components\Page\Logo;
use Webflare\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\SalesChannelRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Theme\ThemeConfigValueAccessor;
use Symfony\Component\Asset\Packages;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

final class LogoTest extends TestCase
{
    private const BUNDLED_LOGO = 'bundles/viewstheme/img/views-logo.svg';

    private const BUNDLED_LOGO_URL = 'asset://bundles/viewstheme/img/views-logo.svg';

    private const STOREFRONT_LOGOS = [
        'sw-logo-desktop' => 'https://shop.test/media/demo-desktop.png',
        'sw-logo-tablet' => 'https://shop.test/media/demo-tablet.png',
        'sw-logo-mobile' => 'https://shop.test/media/demo-mobile.png',
    ];

    public function testEmptyPageLogoIgnoresStorefrontLogosAndUsesBundledAsset(): void
    {
        $requested = [];
        $component = $this->mount(
            [
                'page-logo' => '',
                ...self::STOREFRONT_LOGOS,
            ],
            $requested,
            expectBundledAsset: true,
        );

        self::assertSame(self::BUNDLED_LOGO_URL, $component->logoPath);
        self::assertNull($component->tabletLogoPath);
        self::assertNull($component->mobileLogoPath);
        self::assertSame(['page-logo'], $requested);
    }

    public function testPageLogoWinsOverStorefrontLogos(): void
    {
        $requested = [];
        $pageLogo = 'https://shop.test/media/shop-logo.svg';
        $component = $this->mount(
            [
                'page-logo' => $pageLogo,
                ...self::STOREFRONT_LOGOS,
            ],
            $requested,
            expectBundledAsset: false,
        );

        self::assertSame($pageLogo, $component->logoPath);
        self::assertNull($component->tabletLogoPath);
        self::assertNull($component->mobileLogoPath);
        self::assertSame(['page-logo'], $requested);
    }

    /**
     * @param array<string, string> $theme
     * @param list<string> $requested
     */
    private function mount(array $theme, array &$requested, bool $expectBundledAsset): Logo
    {
        $themeConfig = $this->createStub(ThemeConfigValueAccessor::class);
        $themeConfig->method('get')->willReturnCallback(
            static function (string $key) use ($theme, &$requested): mixed {
                $requested[] = $key;

                return $theme[$key] ?? null;
            },
        );

        $packages = $this->createMock(Packages::class);
        if ($expectBundledAsset) {
            $packages->expects(self::once())
                ->method('getUrl')
                ->with(self::BUNDLED_LOGO, 'asset')
                ->willReturn(self::BUNDLED_LOGO_URL);
        } else {
            $packages->expects(self::never())->method('getUrl');
        }

        $seo = $this->createStub(SeoUrlPlaceholderHandlerInterface::class);
        $seo->method('generate')->willReturn('/');

        $request = new Request();
        $request->attributes->set(
            PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT,
            $this->createStub(SalesChannelContext::class),
        );
        $request->attributes->set(SalesChannelRequest::ATTRIBUTE_THEME_ID, 'theme-id');

        $stack = new RequestStack();
        $stack->push($request);

        $component = new Logo(
            $themeConfig,
            new SalesChannelContextAccessor($stack),
            $stack,
            $packages,
            $seo,
        );
        $component->postMount([]);

        return $component;
    }
}
