<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Subscriber;

use Fyrst\ViewsTheme\Service\ReviewPointsNormalizer;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Normalize review `points` query/body before CMS / loaders run (URL SoT SSR).
 */
class ReviewRequestSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly ReviewPointsNormalizer $pointsNormalizer,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            // After routing; before controllers / CMS resolvers read the request
            KernelEvents::REQUEST => ['onRequest', 0],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $this->pointsNormalizer->normalize($event->getRequest());
    }
}
