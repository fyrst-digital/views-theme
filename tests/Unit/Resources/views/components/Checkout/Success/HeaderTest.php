<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Checkout\Success;

use Fyrst\ViewsTheme\Resources\views\components\Checkout\Success\Header;
use Fyrst\ViewsTheme\Struct\PageTitleMeta;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Order\Aggregate\OrderCustomer\OrderCustomerEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionCollection;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Checkout\Finish\CheckoutFinishPage;
use Symfony\Contracts\Translation\TranslatorInterface;

final class HeaderTest extends TestCase
{
    public function testDefaultHeadingTeaserAndMeta(): void
    {
        $component = $this->component($this->page('10060', 'hello@blurcreative.de'));
        $component->postMount([]);

        self::assertSame('Thank you for your order with Demostore!', $component->heading);
        self::assertSame('Order confirmation email has been sent.', $component->description);
        self::assertSame('10060', $component->orderNumber);
        self::assertSame([
            'orderNumber' => 'Your order number: #10060',
            'email' => 'hello@blurcreative.de',
        ], $this->labels($component->meta));
    }

    public function testChangedPaymentSwapsHeadingAndDescription(): void
    {
        $page = $this->page('10061', 'hello@blurcreative.de', true);

        $component = $this->component($page);
        $component->postMount([]);

        self::assertSame('Thank you for updating your order', $component->heading);
        self::assertSame('Payment: Invoice', $component->description);
    }

    public function testOmitsEmailWithoutOrderCustomer(): void
    {
        $component = $this->component($this->page('10062', null));
        $component->postMount([]);

        self::assertSame(['orderNumber' => 'Your order number: #10062'], $this->labels($component->meta));
    }

    public function testIgnoresNonFinishPage(): void
    {
        $component = $this->component(null);
        $component->postMount([]);

        self::assertSame('', $component->heading);
        self::assertSame([], $component->meta);
    }

    private function component(?CheckoutFinishPage $page): Header
    {
        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(
            static fn (string $id, array $parameters = []): string => match ($id) {
                'checkout.finishHeader' => 'Thank you for your order with ' . $parameters['%shop%'] . '!',
                'checkout.finishUpdateHeader' => 'Thank you for updating your order',
                'checkout.finishPaymentHeader' => 'Payment: ' . $parameters['%paymentName%'],
                'checkout.finishInfoConfirmationMail' => 'Order confirmation email has been sent.',
                'checkout.finishInfoOrdernumber' => 'Your order number: #',
                default => $id,
            },
        );

        $config = $this->createStub(SystemConfigService::class);
        $config->method('get')->willReturn('Demostore');

        $component = new Header($config, $translator);
        $component->page = $page;

        return $component;
    }

    private function page(string $orderNumber, ?string $email, bool $changedPayment = false): CheckoutFinishPage
    {
        $order = new OrderEntity();
        $order->setId('order');
        $order->setSalesChannelId('channel');
        $order->setOrderNumber($orderNumber);

        if ($email !== null) {
            $customer = new OrderCustomerEntity();
            $customer->setId('customer');
            $customer->setEmail($email);
            $order->setOrderCustomer($customer);
        }

        $method = new PaymentMethodEntity();
        $method->setId('method');
        $method->setTranslated(['name' => 'Invoice']);
        $transaction = new OrderTransactionEntity();
        $transaction->setId('transaction');
        $transaction->setPaymentMethod($method);
        $order->setTransactions(new OrderTransactionCollection([$transaction]));

        $page = new CheckoutFinishPage();
        $page->setOrder($order);
        $page->setChangedPayment($changedPayment);

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
