<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Product\SalesChannel\Review\AbstractProductReviewLoader;
use Shopware\Core\Content\Product\SalesChannel\Review\ProductReviewResult;
use Shopware\Core\Framework\Adapter\Request\RequestParamHelper;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * Thin load path for product reviews — core loader only. Controllers fire App hooks.
 */
class ProductReviewGateway
{
    public function __construct(
        private readonly AbstractProductReviewLoader $productReviewLoader,
        private readonly ReviewPointsNormalizer $pointsNormalizer,
    ) {
    }

    public function load(
        Request $request,
        SalesChannelContext $context,
        string $productId,
        ?string $parentId = null,
    ): ProductReviewResult {
        // Belt-and-suspenders for sub-requests / XHR that skip the main-request subscriber path
        $this->pointsNormalizer->normalize($request);

        $resolvedParent = $parentId;
        if ($resolvedParent === null || $resolvedParent === '') {
            $fromRequest = RequestParamHelper::get($request, 'parentId');
            $resolvedParent = \is_string($fromRequest) && $fromRequest !== '' ? $fromRequest : null;
        }

        return $this->productReviewLoader->load($request, $context, $productId, $resolvedParent);
    }
}
