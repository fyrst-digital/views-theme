<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Checkout\Confirm;

use Fyrst\ViewsTheme\Resources\views\components\Checkout\Confirm\Addresses;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Core\Checkout\Customer\CustomerEntity;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\Country\CountryEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Environment;

final class AddressesTest extends TestCase
{
    public function testContextDefaultsBuildCardsAndSplitLines(): void
    {
        $shipping = $this->address('ship', $this->country(true));
        $billing = $this->address('bill', $this->country(true));
        $page = new CheckoutConfirmPage();
        $page->setHideShippingAddress(false);

        $twig = $this->createMock(Environment::class);
        $twig->expects(self::exactly(2))
            ->method('render')
            ->willReturnCallback(static function (string $name, array $context): string {
                self::assertSame('@Framework/snippets/render.html.twig', $name);
                self::assertSame([['address/street']], $context['format']);

                return match ($context['address']->getId()) {
                    'ship' => "  Jane Doe<br/>Main St<br>10115 Berlin  ",
                    'bill' => "Bill Person<br />Town",
                    default => '',
                };
            });

        $component = $this->component($this->context($billing, $shipping), $twig);
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
                'lines' => ['Jane Doe', 'Main St', '10115 Berlin'],
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
                'lines' => ['Bill Person', 'Town'],
            ],
        ], $component->cards);
    }

    public function testExplicitOverridesSkipContext(): void
    {
        $contextBilling = $this->address('context-bill', $this->country(true));
        $contextShipping = $this->address('context-ship', $this->country(true));
        $billing = $this->address('custom-bill', $this->country(false));
        $shipping = $this->address('custom-ship', $this->country(false));

        $twig = $this->createMock(Environment::class);
        $twig->expects(self::once())
            ->method('render')
            ->willReturn('Custom Street');

        $component = $this->component($this->context($contextBilling, $contextShipping), $twig);
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
        self::assertSame(['Custom Street'], $component->cards[0]['lines']);
        self::assertTrue($component->cards[1]['equal']);
        self::assertSame([], $component->cards[1]['lines']);
        self::assertSame('/account/address/custom-bill', $component->cards[1]['editHref']);
    }

    public function testHiddenShippingOmitsColumnAndDivider(): void
    {
        $address = $this->address('only', $this->country(true));
        $page = new CheckoutConfirmPage();
        $page->setHideShippingAddress(true);

        $twig = $this->createMock(Environment::class);
        $twig->expects(self::once())->method('render')->willReturn('Only Street');

        $component = $this->component($this->context($address, $address), $twig);
        $component->page = $page;
        $component->postMount([]);

        self::assertTrue($component->hideShippingAddress);
        self::assertTrue($component->addressesEqual);
        self::assertCount(1, $component->cards);
        self::assertSame('billing', $component->cards[0]['nest']);
        self::assertFalse($component->cards[0]['divided']);
        self::assertFalse($component->cards[0]['equal']);
        self::assertSame(['Only Street'], $component->cards[0]['lines']);
    }

    public function testEqualBillingKeepsShippingLines(): void
    {
        $address = $this->address('same', $this->country(true));

        $twig = $this->createMock(Environment::class);
        $twig->expects(self::once())->method('render')->willReturn("Jane Doe<br/>Main St");

        $component = $this->component($this->context($address, $address), $twig);
        $component->postMount([]);

        self::assertTrue($component->addressesEqual);
        self::assertSame('Same as delivery', $component->equalTitle);
        self::assertSame('Invoices are sent to the delivery address.', $component->equalText);
        self::assertFalse($component->cards[0]['equal']);
        self::assertSame(['Jane Doe', 'Main St'], $component->cards[0]['lines']);
        self::assertTrue($component->cards[1]['equal']);
        self::assertSame([], $component->cards[1]['lines']);
        self::assertTrue($component->cards[1]['divided']);
    }

    public function testUnavailableCountryWarnsOnShippingOnly(): void
    {
        $shipping = $this->address('ship', $this->country(false));
        $billing = $this->address('bill', $this->country(false));

        $component = $this->component($this->context($billing, $shipping), $this->twig('Line'));
        $component->postMount([]);

        self::assertTrue($component->cards[0]['warn']);
        self::assertFalse($component->cards[1]['warn']);
    }

    public function testMissingAddressSkipsHrefAndLines(): void
    {
        $twig = $this->createMock(Environment::class);
        $twig->expects(self::never())->method('render');

        $component = $this->component(null, $twig);
        $component->postMount([]);

        self::assertNull($component->billingAddress);
        self::assertNull($component->shippingAddress);
        self::assertFalse($component->addressesEqual);
        self::assertCount(2, $component->cards);
        self::assertNull($component->cards[0]['editHref']);
        self::assertSame([], $component->cards[0]['lines']);
        self::assertFalse($component->cards[0]['warn']);
        self::assertNull($component->cards[1]['editHref']);
    }

    public function testMissingFormatSkipsRender(): void
    {
        $shipping = $this->address('ship', $this->country(true, null));
        $billing = $this->address('bill');

        $twig = $this->createMock(Environment::class);
        $twig->expects(self::never())->method('render');

        $component = $this->component($this->context($billing, $shipping), $twig);
        $component->postMount([]);

        self::assertSame([], $component->cards[0]['lines']);
        self::assertSame('/account/address/ship', $component->cards[0]['editHref']);
        self::assertSame([], $component->cards[1]['lines']);
    }

    private function component(?SalesChannelContext $context, Environment $twig): Addresses
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
            $twig,
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

    /**
     * @param list<list<string>>|null $format
     */
    private function country(bool $shippingAvailable, ?array $format = [['address/street']]): CountryEntity
    {
        $country = new CountryEntity();
        $country->setId('country');
        $country->setShippingAvailable($shippingAvailable);
        if ($format !== null) {
            $country->setTranslated(['addressFormat' => $format]);
        }

        return $country;
    }

    private function twig(string $rendered): Environment
    {
        $twig = $this->createStub(Environment::class);
        $twig->method('render')->willReturn($rendered);

        return $twig;
    }
}
