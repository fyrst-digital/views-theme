<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Media\MediaUrlPlaceholderHandlerInterface;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\RequestTransformer;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

/**
 * Renders UX components and runs storefront media/SEO placeholder replacement (SoT).
 */
final class ComponentHtmlRenderer
{
    public function __construct(
        private readonly ComponentRendererInterface $components,
        private readonly RequestStack $requestStack,
        private readonly MediaUrlPlaceholderHandlerInterface $mediaUrlReplacer,
        private readonly SeoUrlPlaceholderHandlerInterface $seoUrlReplacer,
    ) {
    }

    /**
     * @param array<string, mixed> $props
     */
    public function render(string $name, array $props = []): string
    {
        return $this->replaceStorefrontPlaceholders(
            $this->components->createAndRender($name, $props),
        );
    }

    public function replaceStorefrontPlaceholders(string $content): string
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return $content;
        }

        $content = $this->mediaUrlReplacer->replace($content);

        $salesChannelContext = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);
        $host = $request->attributes->get(RequestTransformer::STOREFRONT_URL);

        if ($salesChannelContext instanceof SalesChannelContext && \is_string($host) && $host !== '') {
            $content = $this->seoUrlReplacer->replace($content, $host, $salesChannelContext);
        }

        return $content;
    }
}
