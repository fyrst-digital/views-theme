<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Shipping;

use Fyrst\ViewsTheme\Resources\views\components\Shipping\Selection;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Framework\Context;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\Currency\CurrencyEntity;
use Shopware\Core\System\Currency\CurrencyFormatter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryDate;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryPositionCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\ShippingLocation;
use Shopware\Core\Checkout\Cart\LineItem\LineItem;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Content\Product\State;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;

final class SelectionTest extends TestCase
{
    public function testDigitalCartStaysHidden(): void
    {
        $page = $this->page(new Cart('customer'), new ShippingMethodCollection());
        $component = $this->component();
        $component->page = $page;
        $component->postMount([]);

        self::assertFalse($component->visible);
        self::assertSame([], $component->rows);
    }

    public function testRowsUseQuotesAndSelectedDeliveryFallback(): void
    {
        $standard = $this->method('standard', 'Standard', '<p>Free and fast</p>');
        $express = $this->method('express', 'Express', str_repeat('a', 80));
        $economy = $this->method('economy', 'Economy', '   ');

        $cart = new Cart('customer');
        $item = new LineItem('item', LineItem::PRODUCT_LINE_ITEM_TYPE);
        $item->setStates([State::IS_PHYSICAL]);
        $cart->add($item);
        $cart->setDeliveries(new DeliveryCollection([$this->delivery($standard, 4.9)]));

        $page = $this->page($cart, new ShippingMethodCollection([$standard, $express, $economy]));
        $page->addExtension('viewsTheme', new ArrayStruct([
            'shippingPrices' => new ArrayStruct([
                'express' => 0.0,
            ]),
        ]));

        $currency = new CurrencyEntity();
        $currency->setIsoCode('EUR');
        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getCurrency')->willReturn($currency);
        $context->method('getLanguageId')->willReturn('en');
        $context->method('getContext')->willReturn(Context::createDefaultContext());

        $formatter = $this->createMock(CurrencyFormatter::class);
        $formatter->expects(self::once())
            ->method('formatCurrencyByLanguage')
            ->with(4.9, 'EUR', 'en', self::isInstanceOf(Context::class))
            ->willReturn('€4.90');

        $component = $this->component($context, $formatter);
        $component->page = $page;
        $component->selectedId = 'standard';
        $component->postMount([]);

        self::assertTrue($component->visible);
        self::assertSame('standard', $component->selectedId);
        self::assertSame([
            [
                'id' => 'standard',
                'name' => 'Standard',
                'description' => 'Free and fast',
                'trailing' => '€4.90',
                'checked' => true,
            ],
            [
                'id' => 'express',
                'name' => 'Express',
                'description' => str_repeat('a', 75) . ' ...',
                'trailing' => 'Free',
                'checked' => false,
            ],
            [
                'id' => 'economy',
                'name' => 'Economy',
                'description' => null,
                'trailing' => null,
                'checked' => false,
            ],
        ], $component->rows);
    }

    public function testSelectedIdDefaultsToContextShippingMethod(): void
    {
        $method = $this->method('from-context', 'Standard', null);
        $cart = new Cart('customer');
        $item = new LineItem('item', LineItem::PRODUCT_LINE_ITEM_TYPE);
        $item->setStates([State::IS_PHYSICAL]);
        $cart->add($item);

        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getShippingMethod')->willReturn($method);

        $component = $this->component($context);
        $component->page = $this->page($cart, new ShippingMethodCollection([$method]));
        $component->postMount([]);

        self::assertSame('from-context', $component->selectedId);
        self::assertTrue($component->rows[0]['checked']);
    }

    private function component(?SalesChannelContext $context = null, ?CurrencyFormatter $formatter = null): Selection
    {
        $stack = new RequestStack();
        if ($context !== null) {
            $request = new Request();
            $request->attributes->set(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT, $context);
            $stack->push($request);
        }

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static fn (string $id): string => $id === 'viewsTheme.checkout.shippingFree' ? 'Free' : $id,
        );

        return new Selection(
            new SalesChannelContextAccessor($stack),
            $formatter ?? $this->createStub(CurrencyFormatter::class),
            $translator,
        );
    }

    private function page(Cart $cart, ShippingMethodCollection $methods): CheckoutConfirmPage
    {
        $page = new CheckoutConfirmPage();
        $page->setCart($cart);
        $page->setShippingMethods($methods);

        return $page;
    }

    private function method(string $id, string $name, ?string $description): ShippingMethodEntity
    {
        $method = new ShippingMethodEntity();
        $method->setId($id);
        $method->setTranslated([
            'name' => $name,
            'description' => $description,
        ]);

        return $method;
    }

    private function delivery(ShippingMethodEntity $method, float $total): Delivery
    {
        return new Delivery(
            new DeliveryPositionCollection(),
            new DeliveryDate(new \DateTimeImmutable('2026-01-01'), new \DateTimeImmutable('2026-01-02')),
            $method,
            ShippingLocation::createFromCountry(new CountryEntity()),
            new CalculatedPrice($total, $total, new CalculatedTaxCollection(), new TaxRuleCollection()),
        );
    }
}
