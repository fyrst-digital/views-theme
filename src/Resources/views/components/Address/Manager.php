<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity;
use Shopware\Storefront\Page\Address\Listing\AddressListingPage;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Manager — split current vs available per tab.
 */
#[AsTwigComponent]
class Manager
{
    public mixed $page = null;

    public string $tab = 'shipping';

    public bool $hideShipping = false;

    public string $redirectTo = 'frontend.checkout.confirm.page';

    public ?string $managerUrl = null;

    public ?string $editorUrl = null;

    public ?string $switchUrl = null;

    public ?string $defaultUrl = null;

    public ?string $activeShippingId = null;

    public ?string $activeBillingId = null;

    public ?string $defaultShippingId = null;

    public ?string $defaultBillingId = null;

    public mixed $shippingCurrent = null;

    /**
     * @var list<CustomerAddressEntity>
     */
    public array $shippingAvailable = [];

    public mixed $billingCurrent = null;

    /**
     * @var list<CustomerAddressEntity>
     */
    public array $billingAvailable = [];

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public function __construct(
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->tab = $this->tab === 'billing' ? 'billing' : 'shipping';
        if ($this->hideShipping) {
            $this->tab = 'billing';
        }

        $customer = $this->salesChannelContextAccessor->get()?->getCustomer();

        $this->activeShippingId ??= $customer?->getActiveShippingAddress()?->getId();
        $this->activeBillingId ??= $customer?->getActiveBillingAddress()?->getId();
        $this->defaultShippingId ??= $customer?->getDefaultShippingAddressId();
        $this->defaultBillingId ??= $customer?->getDefaultBillingAddressId();

        $addresses = $this->page instanceof AddressListingPage ? $this->page->getAddresses() : [];

        $this->shippingCurrent = $this->find($addresses, $this->activeShippingId);
        $this->billingCurrent = $this->find($addresses, $this->activeBillingId);
        $this->shippingAvailable = $this->others($addresses, $this->activeShippingId);
        $this->billingAvailable = $this->others($addresses, $this->activeBillingId);
    }

    private function find(mixed $addresses, ?string $id): ?CustomerAddressEntity
    {
        if ($id === null || !\is_iterable($addresses)) {
            return null;
        }

        if (\is_object($addresses) && method_exists($addresses, 'get')) {
            $found = $addresses->get($id);

            return $found instanceof CustomerAddressEntity ? $found : null;
        }

        foreach ($addresses as $address) {
            if ($address instanceof CustomerAddressEntity && $address->getId() === $id) {
                return $address;
            }
        }

        return null;
    }

    /**
     * @return list<CustomerAddressEntity>
     */
    private function others(mixed $addresses, ?string $id): array
    {
        $out = [];
        if (!\is_iterable($addresses)) {
            return $out;
        }

        foreach ($addresses as $address) {
            if (!$address instanceof CustomerAddressEntity) {
                continue;
            }
            if ($id !== null && $address->getId() === $id) {
                continue;
            }
            $out[] = $address;
        }

        return $out;
    }
}
