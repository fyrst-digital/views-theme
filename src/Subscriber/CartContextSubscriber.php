<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Shopware\Core\Checkout\Cart\SalesChannel\CartService;
use Shopware\Core\PlatformRequest;
use Shopware\Storefront\Event\StorefrontRenderEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class CartContextSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly CartService $cartService,
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
        $request = $event->getRequest();
        $context = $event->getSalesChannelContext();

        // Resolve the cart token. Prefer the request header (always set by
        // SalesChannelContextService) to avoid getToken() potentially throwing
        // when called inside a Twig rendering context.
        $token = $request->headers->get(PlatformRequest::HEADER_CONTEXT_TOKEN);

        if (!$token) {
            try {
                $token = $context->getToken();
            } catch (\Throwable) {
                return;
            }
        }

        $cart = $this->cartService->getCart($token, $context);
        $context->addExtension('cart', $cart);
    }
}
