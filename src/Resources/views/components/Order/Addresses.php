<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Order;

use Shopware\Core\Checkout\Order\Aggregate\OrderAddress\OrderAddressEntity;
use Shopware\Core\Checkout\Order\Aggregate\OrderDelivery\OrderDeliveryEntity;
use Shopware\Core\Checkout\Order\OrderEntity;
use Shopware\Core\Framework\Feature;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Order:Addresses — order billing/shipping, 6.7 vs 6.8 delivery.
 * Template is a root-host of Address:List.
 */
#[AsTwigComponent]
class Addresses
{
    public mixed $page = null;

    public mixed $order = null;

    public mixed $billingAddress = null;

    public mixed $shippingAddress = null;

    public bool $hideShippingAddress = false;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $order = $this->resolveOrder();
        if ($order === null) {
            return;
        }

        $this->billingAddress = $order->getBillingAddress();
        $delivery = $this->delivery($order);
        $this->hideShippingAddress = $delivery === null;

        if ($delivery === null) {
            $this->shippingAddress = $this->billingAddress;
        } else {
            $billingId = $this->billingAddress instanceof OrderAddressEntity ? $this->billingAddress->getId() : null;
            if ($billingId !== null && $billingId === $delivery->getShippingOrderAddressId()) {
                $this->shippingAddress = $this->billingAddress;
            } else {
                $this->shippingAddress = $delivery->getShippingOrderAddress() ?? $this->billingAddress;
            }
        }
    }

    private function resolveOrder(): ?OrderEntity
    {
        if ($this->order instanceof OrderEntity) {
            return $this->order;
        }

        if (\is_object($this->page) && method_exists($this->page, 'getOrder')) {
            $order = $this->page->getOrder();

            return $order instanceof OrderEntity ? $order : null;
        }

        return null;
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
