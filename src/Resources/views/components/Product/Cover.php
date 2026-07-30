<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\ProductDetailUrlBuilder;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Cover — media + detail URL from product (scalars remain overridable).
 */
#[AsTwigComponent]
class Cover
{
    public mixed $product = null;

    public ?string $id = null;

    public ?string $name = null;

    public mixed $cover = null;

    /**
     * @var array<string, string>
     */
    public array $sizes = [];

    public bool $showLink = true;

    public ?string $url = null;

    public string $tag = 'div';

    public ?string $referrerCategoryId = null;

    public ?string $searchTerm = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $linked = false;

    public string $rootTag = 'div';

    public function __construct(
        private readonly ProductDetailUrlBuilder $productDetailUrlBuilder,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->product instanceof SalesChannelProductEntity) {
            $this->id ??= $this->product->getId();
            $this->name ??= $this->translatedName($this->product);
            $this->cover ??= $this->product->getCover()?->getMedia();
            $this->url ??= $this->productDetailUrlBuilder->forProduct(
                $this->product,
                $this->referrerCategoryId,
                $this->searchTerm,
            );
        } elseif ($this->url === null && $this->id !== null && $this->id !== '') {
            $this->url = $this->productDetailUrlBuilder->forProductId($this->id);
        }

        $this->linked = $this->showLink && $this->url !== null;
        $this->rootTag = $this->linked ? 'a' : $this->tag;
    }

    private function translatedName(SalesChannelProductEntity $product): string
    {
        $translated = $product->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return (string) ($product->getName() ?? '');
    }
}
