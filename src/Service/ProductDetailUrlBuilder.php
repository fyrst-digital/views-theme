<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\Content\Seo\SeoUrlPlaceholderHandlerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Listing-aware product detail URL (productId + optional search / referrerCategoryId).
 */
final class ProductDetailUrlBuilder
{
    public function __construct(
        private readonly SeoUrlPlaceholderHandlerInterface $seoUrlPlaceholderHandler,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function forProduct(
        SalesChannelProductEntity $product,
        ?string $referrerCategoryId = null,
        ?string $searchTerm = null,
    ): string {
        return $this->seoUrlPlaceholderHandler->generate(
            'frontend.detail.page',
            $this->routeArguments($product, $referrerCategoryId, $searchTerm),
        );
    }

    public function forProductId(string $productId): string
    {
        return $this->seoUrlPlaceholderHandler->generate(
            'frontend.detail.page',
            ['productId' => $productId],
        );
    }

    /**
     * @return array<string, string>
     */
    public function routeArguments(
        SalesChannelProductEntity $product,
        ?string $referrerCategoryId = null,
        ?string $searchTerm = null,
    ): array {
        $arguments = ['productId' => $product->getId()];

        $resolvedSearch = $this->resolveSearchTerm($searchTerm);
        $childCount = $product->getChildCount() ?? 0;
        if ($childCount > 0 && $resolvedSearch !== null) {
            $arguments['search'] = $resolvedSearch;
        }

        if ($referrerCategoryId !== null && $referrerCategoryId !== '') {
            $arguments['referrerCategoryId'] = $referrerCategoryId;
        }

        return $arguments;
    }

    public function resolveSearchTerm(?string $searchTerm = null): ?string
    {
        if ($searchTerm !== null && $searchTerm !== '') {
            return $searchTerm;
        }

        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $fromQuery = $request->query->getString('search');

        return $fromQuery !== '' ? $fromQuery : null;
    }
}
