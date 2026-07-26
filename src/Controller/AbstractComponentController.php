<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\Content\Media\MediaUrlPlaceholderHandlerInterface;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\RequestTransformer;
use Symfony\Component\HttpFoundation\Response;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

/**
 * Base for XHR controllers that render UX Twig components.
 *
 * Mirrors StorefrontController::renderStorefront SEO/media placeholder replacement —
 * raw createAndRender output must not be returned without it.
 */
abstract class AbstractComponentController extends StorefrontController
{
    public function __construct(
        protected readonly ComponentRendererInterface $components,
    ) {}

    /**
     * @param array<string, mixed> $props
     */
    protected function renderComponent(string $name, array $props = []): Response
    {
        $request = $this->container->get('request_stack')->getCurrentRequest();
        $content = $this->components->createAndRender($name, $props);

        if ($request !== null) {
            /** @var SalesChannelContext|null $salesChannelContext */
            $salesChannelContext = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);
            $host = $request->attributes->get(RequestTransformer::STOREFRONT_URL);

            if ($salesChannelContext instanceof SalesChannelContext && \is_string($host)) {
                $mediaUrlReplacer = $this->container->get(MediaUrlPlaceholderHandlerInterface::class);
                $seoUrlReplacer = $this->container->get(SeoUrlPlaceholderHandlerInterface::class);

                $content = $mediaUrlReplacer->replace($content);
                $content = $seoUrlReplacer->replace($content, $host, $salesChannelContext);
            }
        }

        $response = new Response($content);
        $response->headers->set('x-robots-tag', 'noindex');
        $response->headers->set('Content-Type', 'text/html; charset=UTF-8');

        return $response;
    }
}
