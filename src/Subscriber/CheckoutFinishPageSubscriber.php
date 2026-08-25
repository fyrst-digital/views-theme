<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Shopware\Storefront\Page\Checkout\Finish\CheckoutFinishPageOrderCriteriaEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CheckoutFinishPageSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutFinishPageOrderCriteriaEvent::class => 'onOrderCriteria',
        ];
    }

    public function onOrderCriteria(CheckoutFinishPageOrderCriteriaEvent $event): void
    {
        $event->getCriteria()
            ->addAssociation('orderCustomer')
            ->addAssociation('transactions.paymentMethod.media')
            ->addAssociation('primaryOrderTransaction.paymentMethod.media')
            ->addAssociation('deliveries.shippingMethod.media')
            ->addAssociation('primaryOrderDelivery.shippingMethod.media');
    }
}
