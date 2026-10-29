<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Checkout;

use Fyrst\ViewsTheme\Resources\views\components\Checkout\Addresses;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

final class AddressesTest extends TestCase
{
    public function testContextDefaultsBuildCards(): void
    {
        $shipping = $this->address('ship', $this->country(true));
        $billing = $this->address('bill', $this->country(true));
        $page = new CheckoutConfirmPage();
        $page->setHideShippingAddress(false);

        $component = $this->component($this->context($billing, $shipping));
        $component->page = $page;
        $component->postMount([]);

        self::assertFalse($component->hideShippingAddress);
        self::assertFalse($component->addressesEqual);
        self::assertSame('Shipping', $component->shippingTitle);
        self::assertSame('Billing', $component->billingTitle);
        self::assertSame('Change', $component->changeLabel);
        self::assertSame([
            [
                'nest' => 'shipping',
                'changeNest' => 'shippingChange',
                'title' => 'Shipping',
                'tab' => 'shipping',
                'changeTitle' => 'Change shipping',
                'divided' => false,
                'equal' => false,
                'warn' => false,
                'editHref' => '/account/address/ship',
                'address' => $shipping,
            ],
            [
                'nest' => 'billing',
                'changeNest' => 'billingChange',
                'title' => 'Billing',
                'tab' => 'billing',
                'changeTitle' => 'Change billing',
                'divided' => true,
                'equal' => false,
                'warn' => false,
                'editHref' => '/account/address/bill',
                'address' => $billing,
            ],
        ], $component->cards);
    }

    public function testExplicitOverridesSkipContext(): void
    {
        $contextBilling = $this->address('context-bill', $this->country(true));
        $contextShipping = $this->address('context-ship', $this->country(true));
        $billing = $this->address('custom-bill', $this->country(false));
        $shipping = $this->address('custom-ship', $this->country(false));

        $component = $this->component($this->context($contextBilling, $contextShipping));
        $component->billingAddress = $billing;
        $component->shippingAddress = $shipping;
        $component->hideShippingAddress = false;
        $component->addressesEqual = true;
        $component->showShippingWarning = false;
        $component->shippingTitle = 'Ship';
        $component->billingTitle = 'Bill';
        $component->equalTitle = 'Same';
        $component->equalText = 'Copy';
        $component->changeLabel = 'Edit';
        $component->postMount([]);

        self::assertSame($billing, $component->billingAddress);
        self::assertSame($shipping, $component->shippingAddress);
        self::assertSame('Ship', $component->shippingTitle);
        self::assertSame('Same', $component->equalTitle);
        self::assertSame('Edit', $component->changeLabel);
        self::assertSame('shipping', $component->cards[0]['nest']);
        self::assertFalse($component->cards[0]['warn']);
        self::assertSame($shipping, $component->cards[0]['address']);
        self::assertTrue($component->cards[1]['equal']);
        self::assertNull($component->cards[1]['address']);
        self::assertSame('/account/address/custom-bill', $component->cards[1]['editHref']);
    }

    public function testHiddenShippingOmitsColumnAndDivider(): void
    {
        $address = $this->address('only', $this->country(true));
        $page = new CheckoutConfirmPage();
        $page->setHideShippingAddress(true);

        $component = $this->component($this->context($address, $address));
        $component->page = $page;
        $component->postMount([]);

        self::assertTrue($component->hideShippingAddress);
        self::assertTrue($component->addressesEqual);
        self::assertCount(1, $component->cards);
        self::assertSame('billing', $component->cards[0]['nest']);
        self::assertFalse($component->cards[0]['divided']);
        self::assertFalse($component->cards[0]['equal']);
        self::assertSame($address, $component->cards[0]['address']);
    }

    public function testEqualBillingKeepsShippingAddress(): void
    {
        $address = $this->address('same', $this->country(true));

        $component = $this->component($this->context($address, $address));
        $component->postMount([]);

        self::assertTrue($component->addressesEqual);
        self::assertSame('Same as delivery', $component->equalTitle);
        self::assertSame('Invoices are sent to the delivery address.', $component->equalText);
        self::assertFalse($component->cards[0]['equal']);
        self::assertSame($address, $component->cards[0]['address']);
        self::assertTrue($component->cards[1]['equal']);
        self::assertNull($component->cards[1]['address']);
        self::assertTrue($component->cards[1]['divided']);
    }

    public function testUnavailableCountryWarnsOnShippingOnly(): void
    {
        $shipping = $this->address('ship', $this->country(false));
        $billing = $this->address('bill', $this->country(false));

        $component = $this->component($this->context($billing, $shipping));
        $component->postMount([]);

        self::assertTrue($component->cards[0]['warn']);
        self::assertFalse($component->cards[1]['warn']);
        self::assertSame($shipping, $component->cards[0]['address']);
        self::assertSame($billing, $component->cards[1]['address']);
    }

    public function testMissingAddressSkipsHref(): void
    {
        $component = $this->component(null);
        $component->postMount([]);

        self::assertNull($component->billingAddress);
        self::assertNull($component->shippingAddress);
        self::assertFalse($component->addressesEqual);
        self::assertCount(2, $component->cards);
        self::assertNull($component->cards[0]['editHref']);
        self::assertNull($component->cards[0]['address']);
        self::assertFalse($component->cards[0]['warn']);
        self::assertNull($component->cards[1]['editHref']);
        self::assertNull($component->cards[1]['address']);
    }

    public function testMissingCountryStillKeepsAddress(): void
    {
        $shipping = $this->address('ship');
        $billing = $this->address('bill');

        $component = $this->component($this->context($billing, $shipping));
        $component->postMount([]);

        self::assertSame($shipping, $component->cards[0]['address']);
        self::assertSame('/account/address/ship', $component->cards[0]['editHref']);
        self::assertSame($billing, $component->cards[1]['address']);
        self::assertFalse($component->cards[0]['warn']);
    }

    public function testReadOnlyOrderAddressesIgnoreContextAndOmitChange(): void
    {
        $contextAddress = $this->address('context', $this->country(false));
        $shipping = $this->orderAddress('order-ship', $this->country(false));
        $billing = $this->orderAddress('order-bill', $this->country(false));

        $component = $this->component($this->context($contextAddress, $contextAddress));
        $component->billingAddress = $billing;
        $component->shippingAddress = $shipping;
        $component->hideShippingAddress = false;
        $component->readOnly = true;
        $component->postMount([]);

        self::assertSame($billing, $component->billingAddress);
        self::assertSame($shipping, $component->shippingAddress);
        self::assertFalse($component->addressesEqual);
        self::assertCount(2, $component->cards);
        self::assertFalse($component->cards[0]['warn']);
        self::assertNull($component->cards[0]['editHref']);
        self::assertSame($shipping, $component->cards[0]['address']);
        self::assertNull($component->cards[1]['editHref']);
        self::assertSame($billing, $component->cards[1]['address']);
    }

    public function testReadOnlyEqualOrderAddressesCollapseBilling(): void
    {
        $address = $this->orderAddress('same');

        $component = $this->component(null);
        $component->billingAddress = $address;
        $component->shippingAddress = $address;
        $component->hideShippingAddress = false;
        $component->readOnly = true;
        $component->postMount([]);

        self::assertTrue($component->addressesEqual);
        self::assertTrue($component->cards[1]['equal']);
        self::assertNull($component->cards[1]['address']);
        self::assertSame($address, $component->cards[0]['address']);
    }

    private function component(?SalesChannelContext $context): Addresses
    {
        $stack = new RequestStack();
        if ($context !== null) {
            $request = new Request();
            $request->attributes->set(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT, $context);
            $stack->push($request);
        }

        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(static fn (string $id): string => match ($id) {
            'viewsTheme.checkout.confirmShippingTitle' => 'Shipping',
            'viewsTheme.checkout.confirmBillingTitle' => 'Billing',
            'viewsTheme.checkout.confirmAddressEqualTitle' => 'Same as delivery',
            'viewsTheme.checkout.confirmAddressEqualText' => 'Invoices are sent to the delivery address.',
            'viewsTheme.checkout.confirmAddressChange' => 'Change',
            'account.overviewChangeShipping' => '<b>Change shipping</b>',
            'account.overviewChangeBilling' => 'Change billing',
            default => $id,
        });

        $urls = $this->createStub(UrlGeneratorInterface::class);
        $urls->method('generate')->willReturnCallback(
            static fn (string $name, array $parameters = []): string => '/account/address/' . ($parameters['addressId'] ?? ''),
        );

        return new Addresses(
            new SalesChannelContextAccessor($stack),
            $translator,
            $urls,
        );
    }

    private function context(CustomerAddressEntity $billing, CustomerAddressEntity $shipping): SalesChannelContext
    {
        $customer = new CustomerEntity();
        $customer->setActiveBillingAddress($billing);
        $customer->setActiveShippingAddress($shipping);

        $context = $this->createStub(SalesChannelContext::class);
        $context->method('getCustomer')->willReturn($customer);

        return $context;
    }

    private function address(string $id, ?CountryEntity $country = null): CustomerAddressEntity
    {
        $address = new CustomerAddressEntity();
        $address->setId($id);
        if ($country !== null) {
            $address->setCountry($country);
        }

        return $address;
    }

    private function orderAddress(string $id, ?CountryEntity $country = null): OrderAddressEntity
    {
        $address = new OrderAddressEntity();
        $address->setId($id);
        if ($country !== null) {
            $address->setCountry($country);
        }

        return $address;
    }

    private function country(bool $shippingAvailable): CountryEntity
    {
        $country = new CountryEntity();
        $country->setId('country');
        $country->setShippingAvailable($shippingAvailable);

        return $country;
    }
}
