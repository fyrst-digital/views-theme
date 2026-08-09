<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Controller;

use Fyrst\ViewsTheme\Service\ComponentHtmlRenderer;
use Fyrst\ViewsTheme\Service\ProductReviewGateway;
use Shopware\Core\Content\Product\SalesChannel\Review\AbstractProductReviewSaveRoute;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewsWidgetLoadedHook;
use Shopware\Core\Framework\Adapter\Request\RequestParamHelper;
use Shopware\Core\Framework\Validation\DataBag\DataBag;
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
        $formValues = $this->formValuesFromBag($data);

        try {
            $this->productReviewSaveRoute->save($productId, $data, $context);
            if ($data->has('id') && $data->get('id')) {
                $ratingSuccess = 2;
            }
            $formValues = null;
        } catch (ConstraintViolationException $exception) {
            $ratingSuccess = -1;
            $formViolations = $exception;
        }

        $reviews = $this->gateway->load($request, $context, $productId, $parentId);
        $this->hook(new ProductReviewsWidgetLoadedHook($reviews, $context));

        $resolvedParent = $parentId ?? $reviews->getParentId();

        return $this->renderComponent('ViewsTheme:Review:Panel', [
            'reviews' => $reviews,
            'productId' => $productId,
            'parentId' => $resolvedParent,
            'ratingSuccess' => $ratingSuccess,
            'formViolations' => $formViolations,
            'formValues' => $formValues,
            'listUrl' => $this->generateUrl('frontend.views-theme.review.list', [
                'productId' => $productId,
            ]),
            'saveUrl' => $this->generateUrl('frontend.views-theme.review.save', [
                'productId' => $productId,
            ]),
        ]);
    }

    private function parentId(Request $request): ?string
    {
        $parentId = RequestParamHelper::get($request, 'parentId');

        return \is_string($parentId) && $parentId !== '' ? $parentId : null;
    }

    /**
     * Plain scalars for Twig — never pass RequestDataBag into components.
     *
     * @return array{points: float, title: string, content: string, id: ?string}
     */
    private function formValuesFromBag(DataBag $data): array
    {
        $points = $data->get('points', 5);
        if (\is_string($points) || \is_int($points) || \is_float($points)) {
            $points = (float) $points;
        } else {
            $points = 5.0;
        }

        $id = $data->get('id');
        $id = \is_string($id) && $id !== '' ? $id : null;

        return [
            'points' => $points,
            'title' => (string) ($data->get('title') ?? ''),
            'content' => (string) ($data->get('content') ?? ''),
            'id' => $id,
        ];
    }
}
