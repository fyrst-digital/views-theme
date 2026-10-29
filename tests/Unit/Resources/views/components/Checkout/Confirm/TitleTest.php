<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Checkout\Confirm;

use Fyrst\ViewsTheme\Resources\views\components\Checkout\Confirm\Title;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Fyrst\ViewsTheme\Struct\PageTitleMeta;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryDate;
use Shopware\Core\Checkout\Cart\Delivery\Struct\DeliveryPositionCollection;
use Shopware\Core\Checkout\Cart\Delivery\Struct\ShippingLocation;
use Shopware\Core\Checkout\Cart\LineItem\LineItem;
use Shopware\Core\Checkout\Cart\LineItem\LineItemCollection;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\Tax\Struct\CalculatedTaxCollection;
use Shopware\Core\Checkout\Cart\Tax\Struct\TaxRuleCollection;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;

final class TitleTest extends TestCase
{
    public function testSameMonthArrivalIncludesEmailAndItems(): void
    {
        $component = $this->component('hello@blurcreative.de', 2, '2026-10-23', '2026-10-25');
        $component->postMount([]);

        self::assertSame('Complete order', $component->heading);
        self::assertSame([
            'email' => 'hello@blurcreative.de',
            'items' => '2 items',
            'arrival' => 'Arrives 23–25 October',
        ], $this->labels($component->meta));
        self::assertNull($component->meta['email']->icon);
    }

    public function testCrossMonthArrivalFormatsBothDates(): void
    {
        $component = $this->component('hello@blurcreative.de', 1, '2026-10-30', '2026-11-02');
        $component->postMount([]);

        self::assertSame(
            'Arrives 30 October–2 November',
            $component->meta['arrival']->label,
        );
    }

    public function testOmitsEmailWithoutCustomer(): void
    {
        $component = $this->component(null, 2, '2026-10-23', '2026-10-25');
        $component->postMount([]);

        self::assertSame([
            'items' => '2 items',
            'arrival' => 'Arrives 23–25 October',
        ], $this->labels($component->meta));
    }

    public function testOmitsArrivalWithoutDelivery(): void
    {
        $component = $this->component('hello@blurcreative.de', 0, null, null);
        $component->postMount([]);

        self::assertSame([
            'email' => 'hello@blurcreative.de',
            'items' => '0 items',
        ], $this->labels($component->meta));
    }

    private function component(?string $email, int $itemCount, ?string $earliest, ?string $latest): Title
    {
        $request = new Request();
        $request->setLocale('en-GB');

        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getCustomer')->willReturn($this->customer($email));
        $request->attributes->set(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT, $context);

        $stack = new RequestStack();
        $stack->push($request);

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static function (string $id, array $parameters = []): string {
                return match ($id) {
                    'checkout.confirmHeader' => 'Complete order',
                    'checkout.itemCounter' => $parameters['%count%'] . ' items',
                    'checkout.confirmArrival' => 'Arrives ' . $parameters['%earliest%'] . '–' . $parameters['%latest%'],
                    default => $id,
                };
            },
        );

        $component = new Title(new SalesChannelContextAccessor($stack), $translator, $stack);
        $component->page = $this->page($itemCount, $earliest, $latest);

        return $component;
    }

    private function customer(?string $email): ?CustomerEntity
    {
        if ($email === null) {
            return null;
        }

        $customer = new CustomerEntity();
        $customer->setEmail($email);

        return $customer;
    }

    private function page(int $itemCount, ?string $earliest, ?string $latest): CheckoutConfirmPage
    {
        $cart = new Cart('token');
        $items = [];
        for ($index = 0; $index < $itemCount; ++$index) {
            $items[] = new LineItem('item-' . $index, LineItem::PRODUCT_LINE_ITEM_TYPE);
        }
        $cart->setLineItems(new LineItemCollection($items));

        if ($earliest !== null && $latest !== null) {
            $cart->setDeliveries(new DeliveryCollection([
                new Delivery(
                    new DeliveryPositionCollection(),
                    new DeliveryDate(new \DateTimeImmutable($earliest), new \DateTimeImmutable($latest)),
                    new ShippingMethodEntity(),
                    ShippingLocation::createFromCountry(new CountryEntity()),
                    new CalculatedPrice(0, 0, new CalculatedTaxCollection(), new TaxRuleCollection()),
                ),
            ]));
        }

        $page = new CheckoutConfirmPage();
        $page->setCart($cart);

        return $page;
    }

    /**
     * @param array<string, PageTitleMeta> $meta
     *
     * @return array<string, string>
     */
    private function labels(array $meta): array
    {
        $labels = [];
        foreach ($meta as $key => $item) {
            $labels[$key] = $item->label;
        }

        return $labels;
    }
}
