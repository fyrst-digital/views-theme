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
 * View-model for Address:Input:Postal — zip code and city, in shop arrangement order.
 */
#[AsTwigComponent]
class Postal
{
    public mixed $data = null;

    public mixed $formViolations = null;

    public string $prefix = '';

    public string $idPrefix = '';

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var list<string>
     */
    public array $order = ['city', 'zip'];

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

        $arrangement = $this->systemConfigService->get('core.loginRegistration.addressInputFieldArrangement', $salesChannelId);
        if (\is_string($arrangement) && $arrangement !== '') {
            $this->order = array_values(array_filter(
                explode('-', $arrangement),
                static fn (string $part): bool => \in_array($part, ['city', 'zip'], true),
            ));
        }
        if ($this->order === []) {
            $this->order = ['city', 'zip'];
        }

        $auto = ComponentData::addressAutocompletePrefix($this->prefix);
        $this->fields = [
            'city' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressCity', 'city', ComponentData::get($this->data, 'city'), true, $auto . 'address-level2'),
            'zipcode' => ComponentData::field($this->idPrefix, $this->prefix, 'AddressZipcode', 'zipcode', ComponentData::get($this->data, 'zipcode'), true, $auto . 'postal-code'),
        ];
    }
}
