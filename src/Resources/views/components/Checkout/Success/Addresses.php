<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Checkout\Success;

use Fyrst\ViewsTheme\Resources\views\components\Order\Addresses as OrderAddresses;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * View-model for Checkout:Success:Addresses — the order addresses of Order:Addresses (6.7 vs 6.8 delivery),
 * rendered by the read-only Checkout:Addresses panel instead of Address:List.
 */
#[AsTwigComponent]
class Addresses extends OrderAddresses
{
}
