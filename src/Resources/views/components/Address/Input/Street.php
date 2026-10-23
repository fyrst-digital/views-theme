<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Fyrst\ViewsTheme\Service\SalesChannelContextAccessor;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Street — street and additional address lines.
 */
#[AsTwigComponent]
class Street
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    public bool $showAdditional1 = false;

    public bool $showAdditional2 = false;

    public bool $additional1Required = false;

    public bool $additional2Required = false;

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    public array $fields = [];

    public function __construct(
        private readonly SystemConfigService $systemConfigService,
        private readonly SalesChannelContextAccessor $salesChannelContextAccessor,
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $salesChannelId = $this->salesChannelContextAccessor->get()?->getSalesChannelId();
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );
        $this->showAdditional1 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField1', $salesChannelId);
        $this->showAdditional2 = (bool) $this->systemConfigService->get('core.loginRegistration.showAdditionalAddressField2', $salesChannelId);
        $this->additional1Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField1Required', $salesChannelId);
        $this->additional2Required = (bool) $this->systemConfigService->get('core.loginRegistration.additionalAddressField2Required', $salesChannelId);

        $auto = ComponentData::addressAutocompletePrefix($this->prefix);
        $this->fields = [
            'street' => ComponentData::field($this->idPrefix, $this->prefix, '-AddressStreet', 'street', ComponentData::get($this->data, 'street'), true, $auto . 'address-line1'),
            'additionalAddressLine1' => ComponentData::field($this->idPrefix, $this->prefix, 'AdditionalField1', 'additionalAddressLine1', ComponentData::get($this->data, 'additionalAddressLine1'), true, $auto . 'address-line2'),
            'additionalAddressLine2' => ComponentData::field($this->idPrefix, $this->prefix, 'AdditionalField2', 'additionalAddressLine2', ComponentData::get($this->data, 'additionalAddressLine2'), true, $auto . 'address-line3'),
        ];
    }
}
