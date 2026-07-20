<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Twig\Environment;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class SearchOverlayController extends StorefrontController
{
    public function __construct(
        private readonly Environment $twig,
    ) {}

    #[Route(
        path: '/widgets/search/overlay',
        name: 'frontend.views-theme.search.overlay',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function overlay(Request $request, SalesChannelContext $context): Response
    {
        $searchTerm = $request->query->getString('search');
        $minSearchLength = $request->query->get('minSearchLength');

        $props = [];

        if ($searchTerm !== '') {
            $props['searchTerm'] = $searchTerm;
        }

        if ($minSearchLength !== null && $minSearchLength !== '') {
            $props['minSearchLength'] = (int) $minSearchLength;
        }

        $html = $this->twig->createTemplate('{{- component(name, props) -}}')->render([
            'name' => 'ViewsTheme:Search:Overlay',
            'props' => $props,
        ]);

        $response = new Response($html);
        $response->headers->set('x-robots-tag', 'noindex');
        $response->headers->set('Content-Type', 'text/html; charset=UTF-8');

        return $response;
    }
}
