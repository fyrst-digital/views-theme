<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Order;

use Shopware\Core\Checkout\Cart\LineItem\LineItem;
use Shopware\Core\Checkout\Order\Aggregate\OrderDelivery\OrderDeliveryEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderTransaction\OrderTransactionStates;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Checkout\Order\OrderStates;
use Shopware\Core\Checkout\Order\SalesChannel\OrderService;
use Shopware\Core\Framework\Feature;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Order:Item — payment/shipping states, 6.7 vs 6.8 accessors.
 */
#[AsTwigComponent]
class Item
{
    public mixed $order = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public string $orderState = '';

    public string $paymentState = '';

    public bool $isPaymentNeeded = false;

    public bool $allowOrderCancellation = false;

    public bool $allowChangePayment = false;

    public bool $hasShipping = false;

    public ?string $shippingStatus = null;

    public ?string $paymentStatus = null;

    public ?string $paymentMethodName = null;

    public ?string $shippingMethodName = null;

    public string $productLineItemType = LineItem::PRODUCT_LINE_ITEM_TYPE;

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if (!$this->order instanceof OrderEntity) {
            return;
        }

        $this->orderState = (string) ($this->order->getStateMachineState()?->getTechnicalName() ?? '');
        $transaction = $this->transaction($this->order);
        $this->paymentState = (string) ($transaction?->getStateMachineState()?->getTechnicalName() ?? '');

        $paymentNeededStates = [
            OrderTransactionStates::STATE_FAILED,
            OrderTransactionStates::STATE_REMINDED,
            OrderTransactionStates::STATE_UNCONFIRMED,
            OrderTransactionStates::STATE_CANCELLED,
        ];

        $this->isPaymentNeeded = \in_array($this->paymentState, $paymentNeededStates, true)
            && $this->orderState !== OrderStates::STATE_CANCELLED;

        $this->allowChangePayment = $this->orderState !== OrderStates::STATE_CANCELLED
            && \in_array($this->paymentState, OrderService::ALLOWED_TRANSACTION_STATES, true);

        $this->allowOrderCancellation = $this->orderState === OrderStates::STATE_OPEN
            && (bool) $this->systemConfigService->get('core.cart.enableOrderRefunds');

        $this->paymentStatus = $this->translatedName($transaction?->getStateMachineState());
        $this->paymentMethodName = $this->translatedName($transaction?->getPaymentMethod());

        $delivery = $this->delivery($this->order);
        $this->hasShipping = $delivery !== null;
        if ($delivery !== null) {
            $this->shippingStatus = $this->translatedName($delivery->getStateMachineState());
            $this->shippingMethodName = $this->translatedName($delivery->getShippingMethod());
        }
    }

    private function translatedName(mixed $entity): ?string
    {
        if ($entity === null || !\is_object($entity) || !method_exists($entity, 'getTranslation')) {
            return null;
        }

        $name = $entity->getTranslation('name');

        return \is_string($name) && $name !== '' ? $name : null;
    }

    private function transaction(OrderEntity $order): ?OrderTransactionEntity
    {
        if (Feature::isActive('v6.8.0.0')) {
            return $order->getPrimaryOrderTransaction();
        }

        $transactions = $order->getTransactions();
        if ($transactions === null || $transactions->count() < 1) {
            return null;
        }

        return $transactions->last();
    }

    private function delivery(OrderEntity $order): ?OrderDeliveryEntity
    {
        if (Feature::isActive('v6.8.0.0')) {
            return $order->getPrimaryOrderDelivery();
        }

        $deliveries = $order->getDeliveries();
        if ($deliveries === null || $deliveries->count() < 1) {
            return null;
        }

        return $deliveries->first();
    }
}
