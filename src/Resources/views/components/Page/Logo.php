<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Page;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\SalesChannelRequest;
use Shopware\Storefront\Theme\ThemeConfigValueAccessor;
use Symfony\Component\Asset\Packages;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Page:Logo — theme logo paths + asset fallback; Twig only composes.
 */
#[AsTwigComponent]
class Logo
{
    private const DEFAULT_LOGO_ASSET = 'bundles/viewstheme/img/views-logo.svg';

    public string $element = 'a';

    public ?string $textLogo = null;

    public ?string $logoPath = null;

    public ?string $tabletLogoPath = null;

    public ?string $mobileLogoPath = null;

    public ?string $href = null;

    public ?string $title = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly ThemeConfigValueAccessor $themeConfig,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly RequestStack $requestStack,
        private readonly Packages $packages,
        private readonly SeoUrlPlaceholderHandlerInterface $seoUrlPlaceholderHandler,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $desktop = $this->nonEmpty($this->logoPath)
            ?? $this->themeString('sw-logo-desktop')
            ?? $this->packages->getUrl(self::DEFAULT_LOGO_ASSET, 'asset');

        $tablet = $this->nonEmpty($this->tabletLogoPath)
            ?? $this->themeString('sw-logo-tablet');

        $mobile = $this->nonEmpty($this->mobileLogoPath)
            ?? $this->themeString('sw-logo-mobile');

        $this->logoPath = $desktop;
        $this->tabletLogoPath = ($tablet !== null && $tablet !== $desktop) ? $tablet : null;
        $this->mobileLogoPath = ($mobile !== null && $mobile !== $desktop) ? $mobile : null;

        $this->href ??= $this->seoUrlPlaceholderHandler->generate('frontend.home.page');
    }

    private function themeString(string $key): ?string
    {
        $context = $this->salesChannelContextAccessor->get();
        if ($context === null) {
            return null;
        }

        $request = $this->requestStack->getCurrentRequest();
        $themeId = $request?->attributes->get(SalesChannelRequest::ATTRIBUTE_THEME_ID);
        $themeId = \is_string($themeId) ? $themeId : null;

        $value = $this->themeConfig->get($key, $context, $themeId);

        return $this->nonEmpty(\is_string($value) ? $value : null);
    }

    private function nonEmpty(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return $value;
    }
}
