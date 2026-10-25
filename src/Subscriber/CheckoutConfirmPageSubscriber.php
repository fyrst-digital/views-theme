<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Fyrst\ViewsTheme\Service\ShippingMethodPriceResolver;
use Shopware\Core\Framework\Struct\ArrayStruct;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPage;
use Shopware\Storefront\Page\Checkout\Confirm\CheckoutConfirmPageLoadedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CheckoutConfirmPageSubscriber implements EventSubscriberInterface
{
    private const CONFIG_DELIVERY_DATE_ACTIVE = 'ViewsTheme.config.deliveryDateActive';
    private const CONFIG_DELIVERY_DATE_MAX_DAYS = 'ViewsTheme.config.deliveryDateMaxDays';
    private const CONFIG_DELIVERY_DATE_CUSTOM_FIELD_KEY = 'ViewsTheme.config.deliveryDateCustomFieldKey';
    private const DEFAULT_MAX_DAYS = 30;
    private const DEFAULT_CUSTOM_FIELD_KEY = 'preferred_delivery_date';

    public function __construct(
        private readonly SystemConfigService $systemConfig,
        private readonly ShippingMethodPriceResolver $shippingMethodPriceResolver,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            CheckoutConfirmPageLoadedEvent::class => 'onCheckoutConfirmPageLoaded',
        ];
    }

    public function onCheckoutConfirmPageLoaded(CheckoutConfirmPageLoadedEvent $event): void
    {
        $page = $event->getPage();
        $salesChannelContext = $event->getSalesChannelContext();

        $this->viewsTheme($page)->set('shippingPrices', new ArrayStruct(
            $this->shippingMethodPriceResolver->resolve(
                $page->getCart(),
                $page->getShippingMethods(),
                $salesChannelContext,
            ),
        ));

        $this->addDeliveryDate($page, $salesChannelContext);
    }

    private function addDeliveryDate(CheckoutConfirmPage $page, SalesChannelContext $salesChannelContext): void
    {
        $active = (bool) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_ACTIVE,
            $salesChannelContext->getSalesChannelId(),
        );

        if (!$active) {
            return;
        }

        $maxDays = (int) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_MAX_DAYS,
            $salesChannelContext->getSalesChannelId(),
        );

        if ($maxDays < 1) {
            $maxDays = self::DEFAULT_MAX_DAYS;
        }

        $customFieldKey = (string) $this->systemConfig->get(
            self::CONFIG_DELIVERY_DATE_CUSTOM_FIELD_KEY,
            $salesChannelContext->getSalesChannelId(),
        );

        if (trim($customFieldKey) === '') {
            $customFieldKey = self::DEFAULT_CUSTOM_FIELD_KEY;
        }

        $today = (new \DateTimeImmutable('today'))->format('Y-m-d');
        $max = (new \DateTimeImmutable('today'))->modify(sprintf('+%d days', $maxDays))->format('Y-m-d');

        $this->viewsTheme($page)->set('deliveryDate', new ArrayStruct([
            'active' => true,
            'min' => $today,
            'max' => $max,
            'customFieldKey' => $customFieldKey,
        ]));
    }

    private function viewsTheme(CheckoutConfirmPage $page): ArrayStruct
    {
        $viewsTheme = $page->getExtension('viewsTheme');
        if (!$viewsTheme instanceof ArrayStruct) {
            $viewsTheme = new ArrayStruct();
            $page->addExtension('viewsTheme', $viewsTheme);
        }

        return $viewsTheme;
    }
}