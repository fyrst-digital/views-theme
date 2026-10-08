<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components;

use Shopware\Core\Checkout\Cart\LineItem\LineItem as CartLineItem;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Order\Aggregate\OrderLineItem\OrderLineItemEntity;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for LineItem — maps a cart or order line item to its type component.
 *
 * Order matches core line-item.html.twig: product, then the discount heuristic, then container, else generic.
 */
#[AsTwigComponent]
class LineItem
{
    public const PRODUCT = 'ViewsTheme:LineItem:Product';

    public const PROMOTION = 'ViewsTheme:LineItem:Promotion';

    public const CONTAINER = 'ViewsTheme:LineItem:Container';

    public const GENERIC = 'ViewsTheme:LineItem:Generic';

    public mixed $lineItem = null;

    public bool $showRemoveButton = true;

    public bool $showQuantitySelect = true;

    public bool $showPrice = true;

    public int $nestingLevel = 0;

    public mixed $deliveries = null;

    public string $tag = 'li';

    public string $layout = 'stacked';

    public string $typeComponent = '';

    /**
     * Props for {@see $typeComponent}. Promotion only accepts lineItem, tag, and layout.
     *
     * @var array<string, mixed>
     */
    public array $typeProps = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->lineItem instanceof CartLineItem && !$this->lineItem instanceof OrderLineItemEntity) {
            return;
        }

        $lineItem = $this->lineItem;
        $type = $this->typeOf($lineItem);

        $this->typeComponent = match (true) {
            $type === CartLineItem::PRODUCT_LINE_ITEM_TYPE => self::PRODUCT,
            $this->isDiscount($lineItem) => self::PROMOTION,
            $type === CartLineItem::CONTAINER_LINE_ITEM => self::CONTAINER,
            default => self::GENERIC,
        };

        $this->typeProps = [
            'lineItem' => $lineItem,
            'tag' => $this->tag,
            'layout' => $this->layout,
        ];

        if ($this->typeComponent === self::PROMOTION) {
            return;
        }

        $this->typeProps['showRemoveButton'] = $this->showRemoveButton;
        $this->typeProps['showQuantitySelect'] = $this->showQuantitySelect;
        $this->typeProps['showPrice'] = $this->showPrice;
        $this->typeProps['nestingLevel'] = $this->nestingLevel;
        $this->typeProps['deliveries'] = $this->deliveries;
    }

    private function isDiscount(CartLineItem|OrderLineItemEntity $lineItem): bool
    {
        if ($this->typeOf($lineItem) === CartLineItem::DISCOUNT_LINE_ITEM) {
            return true;
        }

        if ($this->isGood($lineItem)) {
            return false;
        }

        $totalPrice = $this->totalPrice($lineItem);

        return $totalPrice !== null && $totalPrice <= 0;
    }

    private function typeOf(CartLineItem|OrderLineItemEntity $lineItem): string
    {
        return (string) $lineItem->getType();
    }

    private function isGood(CartLineItem|OrderLineItemEntity $lineItem): bool
    {
        if ($lineItem instanceof CartLineItem) {
            return $lineItem->isGood();
        }

        return $lineItem->getGood();
    }

    private function totalPrice(CartLineItem|OrderLineItemEntity $lineItem): ?float
    {
        $price = $lineItem->getPrice();

        return $price instanceof CalculatedPrice ? $price->getTotalPrice() : null;
    }
}
