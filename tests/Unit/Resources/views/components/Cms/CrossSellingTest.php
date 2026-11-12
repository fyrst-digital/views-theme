<?php

declare(strict_types=1);

namespace Webflare\ViewsTheme\Tests\Unit\Resources\views\components\Cms;

use Webflare\ViewsTheme\Resources\views\components\Cms\CrossSelling;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Content\Product\Aggregate\ProductCrossSelling\ProductCrossSellingEntity;
use Shopware\Core\Content\Product\ProductCollection;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\CrossSellingElement;
use Shopware\Core\Content\Product\SalesChannel\CrossSelling\CrossSellingElementCollection;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;

final class CrossSellingTest extends TestCase
{
    public function testBuildsOneTabPerActiveCrossSellingWithProducts(): void
    {
        $similar = $this->element('a1', 'Similar', products: 3);
        $accessories = $this->element('b2', 'Accessories', products: 1);

        $component = $this->mount(new CrossSellingElementCollection([$similar, $accessories]));

        self::assertTrue($component->visible);
        self::assertSame('cross-selling-tab-a1', $component->activeTabId);
        self::assertSame(['a1', 'b2'], array_map(static fn ($tab) => $tab->id, $component->tabs));
        self::assertSame(['Similar', 'Accessories'], array_map(static fn ($tab) => $tab->name, $component->tabs));
        self::assertSame('cross-selling-tab-b2', $component->tabs[1]->tabId);
        self::assertSame('cross-selling-tab-b2-pane', $component->tabs[1]->panelId);
        self::assertSame($accessories->getProducts(), $component->tabs[1]->products);
    }

    public function testSkipsInactiveAndEmptyCrossSellings(): void
    {
        $component = $this->mount(new CrossSellingElementCollection([
            $this->element('a1', 'Inactive', products: 2, active: false),
            $this->element('b2', 'Empty', products: 0),
            $this->element('c3', 'Shown', products: 1),
        ]));

        self::assertSame(['c3'], array_map(static fn ($tab) => $tab->id, $component->tabs));
        self::assertSame('cross-selling-tab-c3', $component->activeTabId);
    }

    public function testNothingToShowIsInvisible(): void
    {
        foreach ([null, new CrossSellingElementCollection(), [$this->element('a1', 'Empty', products: 0)]] as $input) {
            $component = $this->mount($input);

            self::assertFalse($component->visible);
            self::assertSame([], $component->tabs);
            self::assertNull($component->activeTabId);
        }
    }

    public function testFallsBackToUntranslatedName(): void
    {
        $element = $this->element('a1', 'Fallback', products: 1, translated: false);

        self::assertSame('Fallback', $this->mount([$element])->tabs[0]->name);
    }

    private function mount(mixed $crossSellings): CrossSelling
    {
        $component = new CrossSelling();
        $component->crossSellings = $crossSellings;
        $component->postMount([]);

        return $component;
    }

    private function element(
        string $id,
        string $name,
        int $products,
        bool $active = true,
        bool $translated = true,
    ): CrossSellingElement {
        $crossSelling = new ProductCrossSellingEntity();
        $crossSelling->setId($id);
        $crossSelling->setName($name);
        $crossSelling->setActive($active);
        if ($translated) {
            $crossSelling->setTranslated(['name' => $name]);
        }

        $collection = new ProductCollection();
        for ($i = 0; $i < $products; ++$i) {
            $product = new SalesChannelProductEntity();
            $product->setId($id . '-' . $i);
            $collection->add($product);
        }

        $element = new CrossSellingElement();
        $element->setCrossSelling($crossSelling);
        $element->setProducts($collection);
        $element->setTotal($products);

        return $element;
    }
}
