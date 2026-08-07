<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Fyrst\ViewsTheme\Service\ProductReviewGateway;
use Shopware\Core\Content\Product\SalesChannel\Review\AbstractProductReviewSaveRoute;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewsWidgetLoadedHook;
use Shopware\Core\Framework\Adapter\Request\RequestParamHelper;
use Shopware\Core\Framework\Validation\DataBag\RequestDataBag;
use Shopware\Core\Framework\Validation\Exception\ConstraintViolationException;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Framework\Routing\StorefrontRouteScope;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\UX\TwigComponent\ComponentRendererInterface;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [StorefrontRouteScope::ID]])]
class ReviewController extends AbstractComponentController
{
    public function __construct(
        ComponentRendererInterface $components,
        ComponentHtmlRenderer $htmlRenderer,
        private readonly ProductReviewGateway $gateway,
        private readonly AbstractProductReviewSaveRoute $productReviewSaveRoute,
    ) {
        parent::__construct($components, $htmlRenderer);
    }

    #[Route(
        path: '/vi/product/{productId}/reviews',
        name: 'frontend.views-theme.review.list',
        defaults: ['XmlHttpRequest' => true],
        methods: ['GET'],
    )]
    public function list(string $productId, Request $request, SalesChannelContext $context): Response
    {
        $parentId = $this->parentId($request);
        $reviews = $this->gateway->load($request, $context, $productId, $parentId);
        $this->hook(new ProductReviewsWidgetLoadedHook($reviews, $context));

        return $this->renderComponent('ViewsTheme:Review:Results', [
            'reviews' => $reviews,
            'productId' => $productId,
            'parentId' => $parentId ?? $reviews->getParentId(),
        ]);
    }

    #[Route(
        path: '/vi/product/{productId}/reviews',
        name: 'frontend.views-theme.review.save',
        defaults: [
            'XmlHttpRequest' => true,
            PlatformRequest::ATTRIBUTE_LOGIN_REQUIRED => true,
        ],
        methods: ['POST'],
    )]
    public function save(
        string $productId,
        RequestDataBag $data,
        Request $request,
        SalesChannelContext $context,
    ): Response {
        $parentId = $this->parentId($request);
        if ($parentId !== null) {
            $data->set('parentId', $parentId);
        }

        $ratingSuccess = 1;
        $formViolations = null;
        $formData = $data;

        try {
            $this->productReviewSaveRoute->save($productId, $data, $context);
            if ($data->has('id') && $data->get('id')) {
                $ratingSuccess = 2;
            }
            $formData = null;
        } catch (ConstraintViolationException $exception) {
            $ratingSuccess = -1;
            $formViolations = $exception;
        }

        $reviews = $this->gateway->load($request, $context, $productId, $parentId);
        $this->hook(new ProductReviewsWidgetLoadedHook($reviews, $context));

        return $this->renderComponent('ViewsTheme:Review:Panel', [
            'reviews' => $reviews,
            'productId' => $productId,
            'parentId' => $parentId ?? $reviews->getParentId(),
            'ratingSuccess' => $ratingSuccess,
            'formViolations' => $formViolations,
            'formData' => $formData,
            'mode' => $ratingSuccess === -1 ? 'form' : 'list',
        ]);
    }

    private function parentId(Request $request): ?string
    {
        $parentId = RequestParamHelper::get($request, 'parentId');

        return \is_string($parentId) && $parentId !== '' ? $parentId : null;
    }
}
