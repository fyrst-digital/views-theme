<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Service;

use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Resolves the current sales channel context from the request stack.
 */
final class SalesChannelContextAccessor
{
    public function __construct(
        private readonly RequestStack $requestStack,
    ) {
    }

    public function get(): ?SalesChannelContext
    {
        $request = $this->requestStack->getCurrentRequest();
        if ($request === null) {
            return null;
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);

        return $context instanceof SalesChannelContext ? $context : null;
    }
}
