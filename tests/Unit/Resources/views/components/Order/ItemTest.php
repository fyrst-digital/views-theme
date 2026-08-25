<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Tests\Unit\Resources\views\components\Order;

use Fyrst\ViewsTheme\Resources\views\components\Order\Item;
use PHPUnit\Framework\TestCase;
use Shopware\Core\Checkout\Order\Aggregate\OrderDelivery\OrderDeliveryCollection;
use Shopware\Core\Checkout\Order\Aggregate\OrderDelivery\OrderDeliveryEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionCollection;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Checkout\Order\OrderStates;
use Shopware\Core\Checkout\Payment\PaymentMethodEntity;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\System\StateMachine\Aggregation\StateMachineState\StateMachineStateEntity;
use Shopware\Core\System\SystemConfig\SystemConfigService;

final class ItemTest extends TestCase
{
    public function testFailedPaymentNeedsCompletionWhenOrderIsOpen(): void
    {
        $component = $this->createComponent(enableRefunds: true);
        $component->order = $this->order(
            OrderStates::STATE_OPEN,
            OrderTransactionStates::STATE_FAILED,
        );
        $component->postMount([]);

        self::assertTrue($component->isPaymentNeeded);
        self::assertTrue($component->allowChangePayment);
        self::assertTrue($component->allowOrderCancellation);
        self::assertTrue($component->hasShipping);
        self::assertSame('Paid later', $component->paymentStatus);
        self::assertSame('Invoice', $component->paymentMethodName);
        self::assertSame('Open', $component->shippingStatus);
        self::assertSame('Standard', $component->shippingMethodName);
    }

    public function testCancelledOrderDoesNotAllowPaymentOrCancel(): void
    {
        $component = $this->createComponent(enableRefunds: true);
        $component->order = $this->order(
            OrderStates::STATE_CANCELLED,
            OrderTransactionStates::STATE_FAILED,
        );
        $component->postMount([]);

        self::assertFalse($component->isPaymentNeeded);
        self::assertFalse($component->allowChangePayment);
        self::assertFalse($component->allowOrderCancellation);
    }

    public function testRefundsOffDisablesCancel(): void
    {
        $component = $this->createComponent(enableRefunds: false);
        $component->order = $this->order(
            OrderStates::STATE_OPEN,
            OrderTransactionStates::STATE_PAID,
        );
        $component->postMount([]);

        self::assertFalse($component->isPaymentNeeded);
        self::assertFalse($component->allowOrderCancellation);
    }

    private function createComponent(bool $enableRefunds): Item
    {
        $config = $this->createMock(SystemConfigService::class);
        $config->method('get')->willReturn($enableRefunds);

        return new Item($config);
    }

    private function order(string $orderState, string $paymentState): OrderEntity
    {
        $order = new OrderEntity();
        $order->setId('order-1');
        $order->setStateMachineState($this->state($orderState, 'Open'));

        $transaction = new OrderTransactionEntity();
        $transaction->setId('tx-1');
        $transaction->setStateMachineState($this->state($paymentState, 'Paid later'));
        $payment = new PaymentMethodEntity();
        $payment->setId('pm-1');
        $payment->setName('Invoice');
        $payment->setTranslated(['name' => 'Invoice']);
        $transaction->setPaymentMethod($payment);
        $order->setTransactions(new OrderTransactionCollection([$transaction]));

        $delivery = new OrderDeliveryEntity();
        $delivery->setId('del-1');
        $delivery->setStateMachineState($this->state('open', 'Open'));
        $shipping = new ShippingMethodEntity();
        $shipping->setId('sm-1');
        $shipping->setName('Standard');
        $shipping->setTranslated(['name' => 'Standard']);
        $delivery->setShippingMethod($shipping);
        $order->setDeliveries(new OrderDeliveryCollection([$delivery]));

        return $order;
    }

    private function state(string $technicalName, string $label): StateMachineStateEntity
    {
        $state = new StateMachineStateEntity();
        $state->setId('state-' . $technicalName);
        $state->setTechnicalName($technicalName);
        $state->setName($label);
        $state->setTranslated(['name' => $label]);

        return $state;
    }
}
