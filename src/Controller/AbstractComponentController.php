<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Shopware\Storefront\Controller\StorefrontController;
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
        protected readonly ComponentHtmlRenderer $htmlRenderer,
    ) {
    }

    /**
     * @param array<string, mixed> $props
     */
    protected function renderComponent(string $name, array $props = []): Response
    {
        $content = $this->htmlRenderer->render($name, $props);

        $response = new Response($content);
        $response->headers->set('x-robots-tag', 'noindex');
        $response->headers->set('Content-Type', 'text/html; charset=UTF-8');

        return $response;
    }

    /**
     * Shared SoT for media then SEO placeholder replacement (core renderStorefront parity).
     */
    protected function replaceStorefrontPlaceholders(string $content): string
    {
        return $this->htmlRenderer->replaceStorefrontPlaceholders($content);
    }
}
