<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Resources\views\components\Product;

use Shopware\Core\Framework\Struct\Collection;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Carousel — product list, box layout, item width + matching image `sizes`.
 */
#[AsTwigComponent]
class Carousel
{
    /**
     * Mirrors the `--vi-carousel-item-w` fallback in `Carousel.css` / `Carousel/Item.css`.
     */
    public const DEFAULT_ITEM_WIDTH = '200px';

    private const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];

    /**
     * A plain number (px) or a number with a length unit valid in both CSS and `sizes`.
     */
    private const ITEM_WIDTH_PATTERN = '/^(\d+(?:\.\d+)?)(px|rem|em|vw)?$/i';

    /**
     * Product collection, array or other iterable.
     */
    public mixed $products = [];

    public ?string $title = null;

    /**
     * `Product:Box` layout: `default` | `image` | `minimal` (`standard` / empty → `default`).
     */
    public string $boxLayout = 'default';

    /**
     * Item width (`280px`, `280`, `18rem`). Invalid values fall back to the CSS default.
     */
    public string|int|null $itemWidth = null;

    public ?string $referrerCategoryId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<mixed>
     */
    public array $items = [];

    /**
     * `Product:Box` image `sizes` per breakpoint, all equal to the item width.
     *
     * @var array<string, string>
     */
    public array $sizes = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->boxLayout === '' || $this->boxLayout === 'standard') {
            $this->boxLayout = 'default';
        }

        $this->items = $this->normalizeProducts($this->products);
        $this->itemWidth = $this->normalizeItemWidth($this->itemWidth);
        $this->sizes = array_fill_keys(self::BREAKPOINTS, $this->itemWidth ?? self::DEFAULT_ITEM_WIDTH);
    }

    /**
     * @return list<mixed>
     */
    private function normalizeProducts(mixed $products): array
    {
        if ($products instanceof Collection) {
            $products = $products->getElements();
        }

        if (!is_iterable($products)) {
            return [];
        }

        $items = [];
        foreach ($products as $product) {
            if ($product !== null) {
                $items[] = $product;
            }
        }

        return $items;
    }

    private function normalizeItemWidth(string|int|null $itemWidth): ?string
    {
        $itemWidth = trim((string) $itemWidth);
        if (!preg_match(self::ITEM_WIDTH_PATTERN, $itemWidth, $matches) || (float) $matches[1] <= 0) {
            return null;
        }

        return $matches[1] . strtolower(($matches[2] ?? '') ?: 'px');
    }
}
