<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address;

use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Form — field layout, country flags, visibility; Twig composes.
 */
#[AsTwigComponent]
class Form
{
    public mixed $data = null;

    public mixed $countries = null;

    public mixed $page = null;

    public mixed $formViolations = null;

    public string $prefix = 'address';

    public string $idPrefix = '';

    public bool $showNoShippingPostfix = false;

    public bool $disableNonShippableCountries = false;

    public ?string $vatInputId = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showAdditional1 = false;

    public bool $showAdditional2 = false;

    public bool $additional1Required = false;

    public bool $additional2Required = false;

    public bool $showPhone = false;

    public bool $phoneRequired = false;

    /**
     * @var list<string>
     */
    public array $arrangement = ['city', 'state', 'zip'];

    /**
     * @var list<array<string, mixed>>
     */
    public array $countryOptions = [];

    /**
     * @var array<string, array{requiredZip: bool, requiredState: bool, requiredVat: bool, displayState: bool}>
     */
    public array $countryFlags = [];

    public ?string $countryId = null;

    public ?string $countryStateId = null;

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string|null, autocomplete: string}>
     */
    public array $fields = [];

    public string $countrySelectId = '';

    public string $stateSelectId = '';

    public string $zipInputId = '';

    public string $countryDataUrl = '';

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly TranslatorInterface $translator,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();

        $this->showAdditional1 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField1', $salesChannelId);
        $this->showAdditional2 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField2', $salesChannelId);
        $this->additional1Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField1Required', $salesChannelId);
        $this->additional2Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField2Required', $salesChannelId);
        $this->showPhone = (bool) $this->systemConfigService->get('core.loginRegistration.showPhoneNumberField', $salesChannelId);
        $this->phoneRequired = (bool) $this->systemConfigService->get('core.loginRegistration.phoneNumberFieldRequired', $salesChannelId);

        $arrangement = $this->systemConfigService->get('core.loginRegistration.addressInputFieldArrangement', $salesChannelId);
        if (\is_string($arrangement) && $arrangement !== '') {
            $this->arrangement = array_values(array_filter(
                explode('-', $arrangement),
                static fn (string $part): bool => \in_array($part, ['city', 'state', 'zip'], true),
            ));
        }
        if ($this->arrangement === []) {
            $this->arrangement = ['city', 'state', 'zip'];
        }

        if ($this->countries === null && \is_object($this->page) && method_exists($this->page, 'getCountries')) {
            $this->countries = $this->page->getCountries();
        }

        $this->countryId = $this->resolveCountryId();
        $this->countryStateId = $this->scalar($this->bagValue($this->data, 'countryStateId'));
        $this->buildCountryOptions();

        $this->countrySelectId = $this->idPrefix . $this->prefix . 'AddressCountry';
        $this->stateSelectId = $this->idPrefix . $this->prefix . 'AddressCountryState';
        $this->zipInputId = $this->idPrefix . $this->prefix . 'AddressZipcode';

        $this->fields = $this->buildFields();
    }

    private function resolveCountryId(): ?string
    {
        $fromData = $this->scalar($this->bagValue($this->data, 'countryId'));
        if ($fromData !== null) {
            return $fromData;
        }

        $context = $this->salesChannelContextAccessor->get();
        $channelCountryId = $context?->getSalesChannel()?->getCountryId();
        if (\is_string($channelCountryId) && $channelCountryId !== '') {
            return $channelCountryId;
        }

        if (!\is_iterable($this->countries)) {
            return null;
        }

        $ids = [];
        foreach ($this->countries as $country) {
            if (\is_object($country) && method_exists($country, 'getId')) {
                $ids[] = (string) $country->getId();
            }
        }

        return \count($ids) === 1 ? $ids[0] : null;
    }

    private function buildCountryOptions(): void
    {
        $this->countryOptions = [];
        $this->countryFlags = [];

        if ($this->countryId === null) {
            $this->countryOptions[] = [
                'value' => '',
                'label' => $this->translator->trans('address.countryPlaceholder'),
                'disabled' => true,
                'selected' => true,
            ];
        }

        if (!\is_iterable($this->countries)) {
            return;
        }

        $noShipping = $this->translator->trans('address.countryPostfixNoShipping');

        foreach ($this->countries as $country) {
            if (!\is_object($country) || !method_exists($country, 'getId')) {
                continue;
            }

            $id = (string) $country->getId();
            $label = method_exists($country, 'getTranslation')
                ? (string) ($country->getTranslation('name') ?? $id)
                : $id;
            $shippingAvailable = !method_exists($country, 'getShippingAvailable') || $country->getShippingAvailable();
            if ($this->showNoShippingPostfix && !$shippingAvailable) {
                $label .= ' ' . $noShipping;
            }

            $requiredZip = method_exists($country, 'getPostalCodeRequired') && $country->getPostalCodeRequired();
            $requiredState = method_exists($country, 'getForceStateInRegistration') && $country->getForceStateInRegistration();
            $requiredVat = method_exists($country, 'getVatIdRequired') && $country->getVatIdRequired();
            $displayState = method_exists($country, 'getDisplayStateInRegistration') && $country->getDisplayStateInRegistration();

            $this->countryFlags[$id] = [
                'requiredZip' => (bool) $requiredZip,
                'requiredState' => (bool) $requiredState,
                'requiredVat' => (bool) $requiredVat,
                'displayState' => (bool) $displayState,
            ];

            $this->countryOptions[] = [
                'value' => $id,
                'label' => $label,
                'disabled' => $this->disableNonShippableCountries && !$shippingAvailable,
                'selected' => $this->countryId === $id,
                'requiredZip' => (bool) $requiredZip,
                'requiredState' => (bool) $requiredState,
                'requiredVat' => (bool) $requiredVat,
                'displayState' => (bool) $displayState,
            ];
        }
    }

    /**
     * @return array<string, array{id: string, name: string, value: mixed, violationPath: string|null, autocomplete: string}>
     */
    private function buildFields(): array
    {
        $auto = $this->autocompletePrefix();

        return [
            'street' => $this->field('-AddressStreet', 'street', $auto . 'address-line1'),
            'additionalAddressLine1' => $this->field('AdditionalField1', 'additionalAddressLine1', $auto . 'address-line2'),
            'additionalAddressLine2' => $this->field('AdditionalField2', 'additionalAddressLine2', $auto . 'address-line3'),
            'city' => $this->field('AddressCity', 'city', $auto . 'address-level2'),
            'zipcode' => $this->field('AddressZipcode', 'zipcode', $auto . 'postal-code'),
            'country' => $this->field('AddressCountry', 'countryId', $auto . 'country-name', $this->countryId),
            'countryState' => $this->field('AddressCountryState', 'countryStateId', $auto . 'address-level1', $this->countryStateId),
            'phoneNumber' => $this->field('AddressPhoneNumber', 'phoneNumber', $auto . 'tel'),
        ];
    }

    /**
     * @return array{id: string, name: string, value: mixed, violationPath: string|null, autocomplete: string}
     */
    private function field(string $idSuffix, string $key, string $autocomplete, mixed $value = null): array
    {
        return [
            'id' => $this->idPrefix . $this->prefix . $idSuffix,
            'name' => $this->prefix . '[' . $key . ']',
            'value' => $value ?? $this->bagValue($this->data, $key),
            'violationPath' => '/' . $this->prefix . '/' . $key,
            'autocomplete' => $autocomplete,
        ];
    }

    private function autocompletePrefix(): string
    {
        if ($this->prefix === 'shippingAddress') {
            return 'shipping ';
        }
        if ($this->prefix === 'billingAddress') {
            return 'billing ';
        }

        return '';
    }

    private function bagValue(mixed $data, string $key): mixed
    {
        if ($data === null) {
            return null;
        }

        if (\is_object($data) && method_exists($data, 'get')) {
            try {
                $value = $data->get($key);
                if ($value !== null) {
                    return $value;
                }
            } catch (\Throwable) {
            }
        }

        if (\is_object($data)) {
            $method = 'get' . ucfirst($key);
            if (method_exists($data, $method)) {
                return $data->{$method}();
            }
        }

        if (\is_array($data)) {
            return $data[$key] ?? null;
        }

        return null;
    }

    private function scalar(mixed $value): ?string
    {
        if (!\is_string($value) && !is_numeric($value)) {
            return null;
        }

        $string = (string) $value;

        return $string !== '' ? $string : null;
    }
}
