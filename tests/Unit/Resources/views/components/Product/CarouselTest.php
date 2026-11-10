<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Product;

use Fyrst\ViewsTheme\Resources\views\components\Product\Carousel;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Content\Product\ProductCollection;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;

final class CarouselTest extends TestCase
{
    public function testDefaults(): void
    {
        $component = $this->mount();

        self::assertSame([], $component->items);
        self::assertSame('default', $component->boxLayout);
        self::assertNull($component->itemWidth);
        self::assertSame(
            array_fill_keys(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'], Carousel::DEFAULT_ITEM_WIDTH),
            $component->sizes,
        );
    }

    public function testCollectionBecomesOrderedList(): void
    {
        $first = $this->product('a');
        $second = $this->product('b');

        $component = $this->mount(products: new ProductCollection([$first, $second]));

        self::assertSame([$first, $second], $component->items);
    }

    public function testArrayDropsNullEntries(): void
    {
        $product = $this->product('a');

        $component = $this->mount(products: ['x' => $product, 'y' => null]);

        self::assertSame([$product], $component->items);
    }

    public function testNonIterableProductsAreEmpty(): void
    {
        self::assertSame([], $this->mount(products: 'nope')->items);
    }

    #[DataProvider('boxLayouts')]
    public function testBoxLayoutNormalisation(string $input, string $expected): void
    {
        self::assertSame($expected, $this->mount(boxLayout: $input)->boxLayout);
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function boxLayouts(): iterable
    {
        yield 'empty' => ['', 'default'];
        yield 'core standard' => ['standard', 'default'];
        yield 'image' => ['image', 'image'];
        yield 'minimal' => ['minimal', 'minimal'];
    }

    #[DataProvider('itemWidths')]
    public function testItemWidthNormalisation(string|int|null $input, ?string $expected): void
    {
        $component = $this->mount(itemWidth: $input);

        self::assertSame($expected, $component->itemWidth);
        self::assertSame(
            array_fill_keys(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'], $expected ?? Carousel::DEFAULT_ITEM_WIDTH),
            $component->sizes,
        );
    }

    /**
     * @return iterable<string, array{string|int|null, ?string}>
     */
    public static function itemWidths(): iterable
    {
        yield 'px' => ['280px', '280px'];
        yield 'unitless string' => ['300', '300px'];
        yield 'int' => [250, '250px'];
        yield 'rem upper case' => ['18REM', '18rem'];
        yield 'decimal' => ['17.5rem', '17.5rem'];
        yield 'whitespace' => [' 280px ', '280px'];
        yield 'null' => [null, null];
        yield 'empty' => ['', null];
        yield 'zero' => ['0px', null];
        yield 'percent' => ['50%', null];
        yield 'css injection' => ['280px; color: red', null];
    }

    private function mount(
        mixed $products = [],
        string $boxLayout = 'default',
        string|int|null $itemWidth = null,
    ): Carousel {
        $component = new Carousel();
        $component->products = $products;
        $component->boxLayout = $boxLayout;
        $component->itemWidth = $itemWidth;
        $component->postMount([]);

        return $component;
    }

    private function product(string $id): SalesChannelProductEntity
    {
        $product = new SalesChannelProductEntity();
        $product->setId($id);

        return $product;
    }
}
