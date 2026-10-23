<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\Checkout\Cart\Cart;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryBuilder;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryCalculator;
use Shopware\Core\Checkout\Cart\Delivery\DeliveryProcessor;
use Shopware\Core\Checkout\Cart\Delivery\Struct\Delivery;
use Shopware\Core\Checkout\Cart\LineItem\CartDataCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodCollection;
use Shopware\Core\Checkout\Shipping\ShippingMethodEntity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

/**
 * Quote each confirm shipping method. A method that already has a cart delivery
 * keeps that total. The others are priced on a scratch cart.
 */
final class ShippingMethodPriceResolver
{
    /**
     * @param EntityRepository<ShippingMethodCollection> $shippingMethodRepository
     */
    public function __construct(
        private readonly DeliveryBuilder $deliveryBuilder,
        private readonly DeliveryCalculator $deliveryCalculator,
        private readonly EntityRepository $shippingMethodRepository,
    ) {
    }

    /**
     * @return array<string, float>
     */
    public function resolve(Cart $cart, ShippingMethodCollection $methods, SalesChannelContext $context): array
    {
        if ($methods->count() === 0) {
            return [];
        }

        $loaded = $this->loadMethods($methods, $context);
        $data = new CartDataCollection();
        foreach ($loaded as $method) {
            if (!$method instanceof ShippingMethodEntity) {
                continue;
            }

            $data->set(DeliveryProcessor::buildKey($method->getId()), $method);
        }

        $quotes = [];
        foreach ($methods as $method) {
            if (!$method instanceof ShippingMethodEntity) {
                continue;
            }

            $fromCart = $this->cartDeliveryTotal($cart, $method->getId());
            if ($fromCart !== null) {
                $quotes[$method->getId()] = $fromCart;

                continue;
            }

            $entity = $loaded->get($method->getId());
            if (!$entity instanceof ShippingMethodEntity) {
                $entity = $method;
            }

            $quoted = $this->quote($cart, $entity, $data, $context);
            if ($quoted !== null) {
                $quotes[$method->getId()] = $quoted;
            }
        }

        return $quotes;
    }

    private function loadMethods(ShippingMethodCollection $methods, SalesChannelContext $context): ShippingMethodCollection
    {
        $criteria = (new Criteria($methods->getIds()))
            ->addAssociations([
                'prices',
                'deliveryTime',
                'tax',
            ]);

        $entities = $this->shippingMethodRepository->search($criteria, $context->getContext())->getEntities();

        return $entities instanceof ShippingMethodCollection ? $entities : new ShippingMethodCollection();
    }

    private function cartDeliveryTotal(Cart $cart, string $methodId): ?float
    {
        foreach ($cart->getDeliveries() as $delivery) {
            if (!$delivery instanceof Delivery) {
                continue;
            }

            if ($delivery->getShippingMethod()->getId() !== $methodId) {
                continue;
            }

            return $delivery->getShippingCosts()->getTotalPrice();
        }

        return null;
    }

    private function quote(
        Cart $cart,
        ShippingMethodEntity $method,
        CartDataCollection $data,
        SalesChannelContext $context,
    ): ?float {
        $scratch = new Cart('vi-shipping-price-quote');
        $scratch->setLineItems($cart->getLineItems());

        $deliveries = $this->deliveryBuilder->buildByUsingShippingMethod($scratch, $method, $context);
        $delivery = $deliveries->first();
        if (!$delivery instanceof Delivery) {
            return null;
        }

        $this->deliveryCalculator->calculate($data, $scratch, $deliveries, $context);

        if ($scratch->getErrors()->count() > 0) {
            return null;
        }

        return $delivery->getShippingCosts()->getTotalPrice();
    }
}
