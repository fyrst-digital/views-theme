<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Shopware\Core\Checkout\Cart\Event\CheckoutOrderPlacedEvent;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RequestStack;

class CheckoutOrderPlacedSubscriber implements EventSubscriberInterface
{
    private const CONFIG_DELIVERY_DATE_ACTIVE = 'ViewsTheme.config.deliveryDateActive';
    private const CONFIG_DELIVERY_DATE_MAX_DAYS = 'ViewsTheme.config.deliveryDateMaxDays';
    private const CONFIG_DELIVERY_DATE_CUSTOM_FIELD_KEY = 'ViewsTheme.config.deliveryDateCustomFieldKey';
    private const DEFAULT_MAX_DAYS = 30;
    private const DEFAULT_CUSTOM_FIELD_KEY = 'preferred_delivery_date';
    private const FORM_FIELD = 'viewsThemeDeliveryDate';

    public function __construct(
        private readonly RequestStack $requestStack,
        private readonly SystemConfigService $systemConfig,
        private readonly EntityRepository $orderRepository,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutOrderPlacedEvent::class => 'onOrderPlaced',
        ];
    }

    public function onOrderPlaced(CheckoutOrderPlacedEvent $event): void
    {
        $salesChannelId = $event->getSalesChannelContext()->getSalesChannelId();

        $active = (bool) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_ACTIVE,
            $salesChannelId,
        );

        if (!$active) {
            return;
        }

        $request = $this->requestStack->getMainRequest();
        if ($request === null) {
            $request = $this->requestStack->getCurrentRequest();
        }

        if ($request === null) {
            return;
        }

        $date = $request->request->get(self::FORM_FIELD);
        if (!is_string($date) || trim($date) === '') {
            return;
        }

        $parsed = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
            return;
        }

        $today = new \DateTimeImmutable('today');
        if ($parsed < $today) {
            return;
        }

        $maxDays = (int) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_MAX_DAYS,
            $salesChannelId,
        );

        if ($maxDays < 1) {
            $maxDays = self::DEFAULT_MAX_DAYS;
        }

        $max = $today->modify(sprintf('+%d days', $maxDays));
        if ($parsed > $max) {
            return;
        }

        $key = (string) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_CUSTOM_FIELD_KEY,
            $salesChannelId,
        );

        if (trim($key) === '') {
            $key = self::DEFAULT_CUSTOM_FIELD_KEY;
        }

        $this->orderRepository->upsert([
            [
                'id' => $event->getOrder()->getId(),
                'customFields' => [
                    $key => $date,
                ],
            ],
        ], $event->getContext());
    }
}