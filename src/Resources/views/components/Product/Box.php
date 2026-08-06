<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Product;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Content\Product\SalesChannel\SalesChannelProductEntity;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Product:Box — card display fields + flags; children own detail URLs.
 */
#[AsTwigComponent]
class Box
{
    private const DEFAULT_SIZES = [
        'xs' => '500px',
        'sm' => '315px',
        'md' => '390px',
        'lg' => '350px',
        'xl' => '280px',
        'xxl' => '280px',
    ];

    public mixed $product = null;

    public string $layout = 'default';

    /**
     * @var array<string, string>
     */
    public array $sizes = self::DEFAULT_SIZES;

    public bool $showDescription = false;

    public bool $showVariations = true;

    public bool $showPrice = true;

    public bool $showActions = true;

    public bool $priceShowPrice = true;

    public mixed $priceShowTaxNote = false;

    public ?string $referrerCategoryId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public ?string $id = null;

    public string $name = '';

    public string $brand = '';

    public float $price = 0.0;

    public bool $wishlistEnabled = false;

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly SystemConfigService $systemConfigService,
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        if ($this->layout === '') {
            $this->layout = 'default';
        }

        $this->wishlistEnabled = (bool) $this->systemConfigService->get(
            'core.cart.wishlistEnabled',
            $this->salesChannelContextAccessor->get()?->getSalesChannelId(),
        );

        if (!$this->product instanceof SalesChannelProductEntity) {
            return;
        }

        $this->id = $this->product->getId();
        $this->name = $this->translatedName($this->product);
        $this->brand = $this->manufacturerName($this->product);
        $this->price = $this->product->getCalculatedPrice()->getUnitPrice();
    }


    private function translatedName(SalesChannelProductEntity $product): string
    {
        $translated = $product->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return (string) ($product->getName() ?? '');
    }

    private function manufacturerName(SalesChannelProductEntity $product): string
    {
        $manufacturer = $product->getManufacturer();
        if ($manufacturer === null) {
            return '';
        }

        $translated = $manufacturer->getTranslation('name');
        if (\is_string($translated) && $translated !== '') {
            return $translated;
        }

        return (string) ($manufacturer->getName() ?? '');
    }
}
