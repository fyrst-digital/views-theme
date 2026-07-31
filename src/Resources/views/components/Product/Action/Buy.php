<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product\Action;

use Shopware\Core\Content\Product\ProductDefinition;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Action:Buy — quantity gates + pack unit; Twig only composes.
 */
#[AsTwigComponent]
class Buy
{
    public mixed $product = null;

    public ?string $formId = null;

    public bool $showQuantity = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showQuantityField = false;

    public ?string $productUnit = null;

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $this->formId ??= 'ProductBuyForm' . $this->product->getId();

        $minPurchase = $this->product->getMinPurchase() ?? 1;
        $this->showQuantityField = $this->showQuantity && $this->allowsQuantity($this->product);
        $this->productUnit = $this->resolveProductUnit($this->product, $minPurchase);
    }

    private function allowsQuantity(SalesChannelProductEntity $product): bool
    {
        if ($product->getType() !== ProductDefinition::TYPE_DIGITAL) {
            return true;
        }

        return $product->getMaxPurchase() !== 1;
    }

    private function resolveProductUnit(SalesChannelProductEntity $product, int $minPurchase): ?string
    {
        $packUnit = $this->translatedString($product, 'packUnit');
        if ($packUnit === null) {
            return null;
        }

        if ($minPurchase > 1) {
            $plural = $this->translatedString($product, 'packUnitPlural');
            if ($plural !== null) {
                return $plural;
            }
        }

        return $packUnit;
    }

    private function translatedString(SalesChannelProductEntity $product, string $field): ?string
    {
        $translated = $product->getTranslation($field);
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return null;
    }
}
