<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * View-model for Product:Prices — price stack inputs; Twig composes children.
 */
#[AsTwigComponent]
class Prices
{
    public mixed $product = null;

    public bool $showPrice = true;

    public bool $showTieredPrices = true;

    public bool $showTaxNote = true;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];
}
