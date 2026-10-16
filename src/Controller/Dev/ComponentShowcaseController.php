<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller\Dev;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Controller\StorefrontController;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Shopware\Storefront\Page\GenericPageLoaderInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class ComponentShowcaseController extends StorefrontController
{
    public function __construct(
        private readonly GenericPageLoaderInterface $genericPageLoader,
    ) {
    }

    #[Route(
        path: '/vi/components/forms',
        name: 'frontend.views-theme.components.forms',
        methods: ['GET'],
    )]
    public function forms(Request $request, SalesChannelContext $context): Response
    {
        $page = $this->genericPageLoader->load($request, $context);
        $page->getMetaInformation()?->setMetaTitle('Forms');
        $page->getMetaInformation()?->setRobots('noindex,nofollow');

        $response = $this->renderStorefront('@ViewsTheme/storefront/page/showcase/forms.html.twig', [
            'page' => $page,
        ]);
        $response->headers->set('x-robots-tag', 'noindex');

        return $response;
    }
}
