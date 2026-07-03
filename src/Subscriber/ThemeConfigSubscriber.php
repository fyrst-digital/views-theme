<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Fyrst\ViewsTheme\Service\ThemeParametersResolver;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ThemeConfigSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly ThemeParametersResolver $themeParametersResolver,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            StorefrontRenderEvent::class => 'onStorefrontRender',
        ];
    }

    public function onStorefrontRender(StorefrontRenderEvent $event): void
    {
        $themeParameters = $this->themeParametersResolver->resolve(
            $event->getRequest(),
            $event->getSalesChannelContext(),
        );

        if ($themeParameters !== null) {
            $event->setParameter('themeParameters', $themeParameters);
        }
    }
}
