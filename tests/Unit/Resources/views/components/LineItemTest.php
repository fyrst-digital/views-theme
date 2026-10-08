<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components;

use Fyrst\ViewsTheme\Resources\views\components\LineItem;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\LineItem\LineItem as CartLineItem;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Checkout\Order\Aggregate\OrderLineItem\OrderLineItemEntity;

final class LineItemTest extends TestCase
{
    public function testProductWinsOverDiscountLikePrice(): void
    {
        $lineItem = $this->cart(CartLineItem::PRODUCT_LINE_ITEM_TYPE, good: false, totalPrice: -5.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::PRODUCT, $component->typeComponent);
        self::assertSame($this->fullProps($lineItem), $component->typeProps);
    }

    public function testDiscountTypeIsPromotionEvenWhenGood(): void
    {
        $lineItem = $this->cart(CartLineItem::DISCOUNT_LINE_ITEM, good: true, totalPrice: 10.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::PROMOTION, $component->typeComponent);
        self::assertSame($this->promotionProps($lineItem), $component->typeProps);
    }

    public function testNotGoodWithNonPositiveTotalIsPromotion(): void
    {
        $lineItem = $this->cart(CartLineItem::CREDIT_LINE_ITEM_TYPE, good: false, totalPrice: 0.0);
        $component = $this->mount($lineItem, showRemoveButton: false, layout: 'grid', tag: 'div');

        self::assertSame(LineItem::PROMOTION, $component->typeComponent);
        self::assertSame([
            'lineItem' => $lineItem,
            'tag' => 'div',
            'layout' => 'grid',
        ], $component->typeProps);
        self::assertArrayNotHasKey('showRemoveButton', $component->typeProps);
        self::assertArrayNotHasKey('deliveries', $component->typeProps);
    }

    public function testNotGoodWithPositiveTotalIsGeneric(): void
    {
        $lineItem = $this->cart(CartLineItem::CUSTOM_LINE_ITEM_TYPE, good: false, totalPrice: 5.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::GENERIC, $component->typeComponent);
        self::assertSame($this->fullProps($lineItem), $component->typeProps);
    }

    public function testGoodPromotionTypeIsGeneric(): void
    {
        $lineItem = $this->cart(CartLineItem::PROMOTION_LINE_ITEM_TYPE, good: true, totalPrice: -1.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::GENERIC, $component->typeComponent);
    }

    public function testContainer(): void
    {
        $lineItem = $this->cart(CartLineItem::CONTAINER_LINE_ITEM, good: true, totalPrice: 12.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::CONTAINER, $component->typeComponent);
        self::assertSame($this->fullProps($lineItem), $component->typeProps);
    }

    public function testDiscountLikeContainerIsPromotion(): void
    {
        $lineItem = $this->cart(CartLineItem::CONTAINER_LINE_ITEM, good: false, totalPrice: -1.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::PROMOTION, $component->typeComponent);
        self::assertSame($this->promotionProps($lineItem), $component->typeProps);
    }

    public function testUnknownTypeIsGeneric(): void
    {
        $lineItem = $this->cart('plugin-custom', good: true, totalPrice: 3.0);
        $component = $this->mount($lineItem);

        self::assertSame(LineItem::GENERIC, $component->typeComponent);
        self::assertArrayHasKey('showQuantitySelect', $component->typeProps);
        self::assertArrayHasKey('showPrice', $component->typeProps);
        self::assertArrayHasKey('nestingLevel', $component->typeProps);
    }

    public function testOrderLineItemUsesGetGood(): void
    {
        $lineItem = new OrderLineItemEntity();
        $lineItem->setId('order-line-1');
        $lineItem->setType(CartLineItem::CUSTOM_LINE_ITEM_TYPE);
        $lineItem->setGood(false);
        $lineItem->setPrice($this->price(-8.0));

        $component = $this->mount($lineItem);

        self::assertSame(LineItem::PROMOTION, $component->typeComponent);
        self::assertSame($this->promotionProps($lineItem), $component->typeProps);
    }

    public function testMissingLineItemDoesNotResolve(): void
    {
        $component = new LineItem();
        $component->postMount([]);

        self::assertSame('', $component->typeComponent);
        self::assertSame([], $component->typeProps);
    }

    private function mount(
        CartLineItem|OrderLineItemEntity $lineItem,
        bool $showRemoveButton = true,
        string $layout = 'stacked',
        string $tag = 'li',
    ): LineItem {
        $component = new LineItem();
        $component->lineItem = $lineItem;
        $component->showRemoveButton = $showRemoveButton;
        $component->layout = $layout;
        $component->tag = $tag;
        $component->deliveries = ['delivery-1'];
        $component->postMount(['class' => 'vi-cart-items__item']);

        return $component;
    }

    /**
     * @return array<string, mixed>
     */
    private function fullProps(CartLineItem|OrderLineItemEntity $lineItem): array
    {
        return [
            'lineItem' => $lineItem,
            'tag' => 'li',
            'layout' => 'stacked',
            'showRemoveButton' => true,
            'showQuantitySelect' => true,
            'showPrice' => true,
            'nestingLevel' => 0,
            'deliveries' => ['delivery-1'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function promotionProps(CartLineItem|OrderLineItemEntity $lineItem): array
    {
        return [
            'lineItem' => $lineItem,
            'tag' => 'li',
            'layout' => 'stacked',
        ];
    }

    private function cart(string $type, bool $good, float $totalPrice): CartLineItem
    {
        $lineItem = new CartLineItem('line-1', $type, 'ref-1', 1);
        $lineItem->setGood($good);
        $lineItem->setPrice($this->price($totalPrice));

        return $lineItem;
    }

    private function price(float $totalPrice): CalculatedPrice
    {
        return new CalculatedPrice(
            $totalPrice,
            $totalPrice,
            new CalculatedTaxCollection(),
            new TaxRuleCollection(),
            1,
        );
    }
}
