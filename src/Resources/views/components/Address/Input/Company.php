<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Resources\views\components\Address\Input;

use Fyrst\ViewsTheme\Service\ComponentData;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

/**
 * View-model for Address:Input:Company — company, department, and VAT field codes.
 */
#[AsTwigComponent]
class Company
{
    public mixed $data = null;

    public string $prefix = '';

    public string $idPrefix = '';

    public bool $showVat = true;

    public mixed $vatValue = null;

    public mixed $formViolations = null;

    /**
     * @var array<string, mixed>
     */
    public array $cva = [];

    /**
     * @var array<string, array{id: string, name: string, value: mixed, violationPath: string, autocomplete?: string}>
     */
    public array $fields = [];

    public function __construct(
        private readonly RequestStack $requestStack,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    #[PostMount]
    public function postMount(array $data): void
    {
        $this->formViolations = ComponentData::formViolations(
            $this->formViolations,
            $this->requestStack->getCurrentRequest(),
        );

        $vatName = $this->prefix !== '' && $this->prefix !== 'billingAddress'
            ? $this->prefix . '[vatIds][]'
            : 'vatIds[]';

        $this->vatValue = ComponentData::scalar($this->vatValue) ?? $this->resolveVatValue();

        $this->fields = [
            'company' => ComponentData::field($this->idPrefix, $this->prefix, '-company', 'company', ComponentData::get($this->data, 'company'), true, 'section-personal organization'),
            'department' => ComponentData::field($this->idPrefix, $this->prefix, '-department', 'department', ComponentData::get($this->data, 'department'), true, 'organization'),
            'vat' => [
                'id' => $this->idPrefix . $this->prefix . '-vatIds',
                'name' => $vatName,
                'value' => $this->vatValue,
                'violationPath' => '/vatIds',
                'autocomplete' => 'off',
            ],
        ];
    }

    private function resolveVatValue(): ?string
    {
        $vat = ComponentData::get($this->data, 'vatIds');
        if (\is_array($vat)) {
            $vat = $vat[0] ?? null;
        }

        return ComponentData::scalar($vat);
    }
}
