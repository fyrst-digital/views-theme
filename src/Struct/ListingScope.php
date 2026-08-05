<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Struct;

/**
 * Category or search listing scope for ProductListingGateway.
 */
final readonly class ListingScope
{
    private function __construct(
        public ?string $navigationId,
        public ?string $searchTerm,
    ) {
    }

    public static function category(string $navigationId): self
    {
        return new self($navigationId, null);
    }

    public static function search(string $term): self
    {
        return new self(null, $term);
    }

    public function isCategory(): bool
    {
        return $this->navigationId !== null && $this->navigationId !== '';
    }

    public function isSearch(): bool
    {
        return $this->searchTerm !== null && $this->searchTerm !== '';
    }
}
