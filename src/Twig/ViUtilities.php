<?php

declare(strict_types=1);

namespace Fyrst\ViewsTheme\Twig;

use Symfony\UX\TwigComponent\ComponentAttributes;
use Symfony\UX\TwigComponent\ComponentFactory;
use Symfony\UX\TwigComponent\ComponentStack;
use Twig\Environment;
use Twig\Error\RuntimeError;
use Twig\Extension\AbstractExtension;
use Twig\Extra\Html\Cva;
use Twig\Runtime\EscaperRuntime;
use Twig\Template;
use Twig\TwigFilter;
use Twig\TwigFunction;

class ViUtilities extends AbstractExtension
{
    private const CVA_FILE_SUFFIX = '.cva.twig';

    private const HTML_TWIG_SUFFIX = '.html.twig';

    private const META_ATTRS = 'vi_attrs';

    private const META_CLASSES = 'vi_classes';

    private const CTX_ATTRS = '__vi_attrs';

    private const CTX_CLASSES = '__vi_classes';

    /**
     * Stack of configs captured while evaluating `.cva.twig` files.
     *
     * @var list<array<string, mixed>>
     */
    private array $cvaExportStack = [];

    public function __construct(
        private readonly ?ComponentStack $componentStack = null,
        private readonly ?ComponentFactory $componentFactory = null,
    ) {
    }

    public function getFilters(): array
    {
        return [
            new TwigFilter('vi_merge_deep', [$this, 'mergeDeep']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('vi_define_cva', [$this, 'defineCva'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            // Aliases — prefer vi_define_cva
            new TwigFunction('vi_cva', [$this, 'defineCva'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            new TwigFunction('vi_cva_from_file', [$this, 'defineCva'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            new TwigFunction('vi_define_attrs', [$this, 'defineAttrs'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            new TwigFunction('vi_attrs', [$this, 'attrs'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            new TwigFunction('vi_class', [$this, 'class'], [
                'needs_context' => true,
            ]),
            // Internal: used while evaluating sibling `.cva.twig` expression files.
            new TwigFunction('__vi_cva_export', [$this, 'exportCvaConfig']),
        ];
    }

    /**
     * Bind CVA config and export slots for `vi_class`. Use with `{% do %}` — no `{% set cx %}`.
     *
     * Config (1st arg):
     * - Sibling `Name.cva.twig` when present: load file, deep-merge 1st arg as overrides (`cva` prop).
     * - Else treat 1st arg as a full inline slot config map.
     *
     * 2nd arg (optional):
     * - `list<string>` — slot names to export for `vi_class` (omit = export all).
     * - `string` — explicit `.cva.twig` path / short name.
     * - `ComponentAttributes` — attributes bag.
     *
     * @param array<string, mixed>                                                     $context
     * @param array<string, mixed>                                                     $config
     * @param list<string>|array<string, mixed>|ComponentAttributes|string|null        $exportOrRef
     */
    public function defineCva(
        Environment $env,
        array &$context,
        array $config = [],
        array|ComponentAttributes|string|null $exportOrRef = null,
        ?ComponentAttributes $attributes = null,
    ): string {
        $exportSlots = null;
        $templateRef = null;

        if (\is_string($exportOrRef)) {
            $templateRef = $exportOrRef;
        } elseif ($exportOrRef instanceof ComponentAttributes) {
            $attributes = $exportOrRef;
        } elseif (\is_array($exportOrRef)) {
            if (array_is_list($exportOrRef)) {
                $exportSlots = array_values(array_map(static fn (mixed $s): string => (string) $s, $exportOrRef));
            } else {
                // Options: { classes: [...], file: '…' }
                if (isset($exportOrRef['classes']) && \is_array($exportOrRef['classes'])) {
                    $exportSlots = array_values(array_map(
                        static fn (mixed $s): string => (string) $s,
                        $exportOrRef['classes'],
                    ));
                }
                if (isset($exportOrRef['file']) && \is_string($exportOrRef['file'])) {
                    $templateRef = $exportOrRef['file'];
                }
            }
        }

        $slotConfig = $this->resolveSlotConfig($env, $context, $config, $templateRef);
        $map = $this->buildCvaMap($env, $context, $slotConfig, $attributes);
        $this->exportClassSlots($context, $map, $exportSlots);

        return '';
    }

    /**
     * Bind nest bags from `attributes` onto the current component (stack + context).
     * Resolve with `vi_attrs('slot')` — do not `{% set attrs %}`.
     *
     * @param array<string, mixed> $context
     * @param list<string>         $slots
     */
    public function defineAttrs(Environment $env, array &$context, array $slots): string
    {
        $attributes = $context['attributes'] ?? null;
        if (!$attributes instanceof ComponentAttributes) {
            $attributes = new ComponentAttributes([], $env->getRuntime(EscaperRuntime::class));
            $context['attributes'] = $attributes;
        }

        $map = [];
        foreach ($slots as $slot) {
            $name = (string) $slot;
            if ($name === '') {
                continue;
            }
            $map[$name] = $attributes->nested($name);
        }

        $context[self::CTX_ATTRS] = $map;
        $this->storeOnCurrentComponent(self::META_ATTRS, $map);

        return '';
    }

    /**
     * Resolve a nest bag bound by `vi_define_attrs` (component stack, then context / outerScope).
     *
     * @param array<string, mixed> $context
     */
    public function attrs(Environment $env, array $context, string $slot): ComponentAttributes
    {
        $bag = $this->resolveFromStack(self::META_ATTRS, $slot);
        if ($bag instanceof ComponentAttributes) {
            return $bag;
        }

        $bag = $this->resolveFromContextMaps($context, [self::CTX_ATTRS], $slot);
        if ($bag instanceof ComponentAttributes) {
            return $bag;
        }

        return new ComponentAttributes([], $env->getRuntime(EscaperRuntime::class));
    }

    /**
     * Apply an exported CVA slot (stack / context). Variants at the use site.
     *
     * @param array<string, mixed> $context
     * @param array<string, mixed> $variants
     */
    public function class(array $context, string $slot, array $variants = []): string
    {
        $cvaSlot = $this->resolveFromStack(self::META_CLASSES, $slot);
        if (!$cvaSlot instanceof ViCvaSlot) {
            $cvaSlot = $this->resolveFromContextMaps($context, [self::CTX_CLASSES], $slot);
        }

        if (!$cvaSlot instanceof ViCvaSlot) {
            return '';
        }

        return $cvaSlot->apply($variants);
    }

    public function mergeDeep(array $source, array $target): array
    {
        return array_merge_recursive($source, $target);
    }

    /**
     * @param array<string, mixed> $config
     *
     * @internal
     */
    public function exportCvaConfig(array $config): string
    {
        $this->cvaExportStack[] = $config;

        return '';
    }

    /**
     * @param array<string, mixed>                $context
     * @param array<string, mixed>                $config
     *
     * @return array<string, array<string, mixed>>
     */
    private function resolveSlotConfig(
        Environment $env,
        array $context,
        array $config,
        ?string $templateRef,
    ): array {
        $cvaTemplate = null;

        if ($templateRef !== null && $templateRef !== '') {
            $cvaTemplate = $this->normalizeCvaTemplateRef($templateRef);
            if (!$env->getLoader()->exists($cvaTemplate)) {
                throw new RuntimeError(\sprintf('CVA file "%s" not found.', $cvaTemplate));
            }
        } else {
            $htmlTemplate = $this->resolveCallerHtmlTemplate();
            if ($htmlTemplate !== null) {
                $sibling = $this->htmlTemplateToCvaTemplate($htmlTemplate);
                if ($env->getLoader()->exists($sibling)) {
                    $cvaTemplate = $sibling;
                }
            }
        }

        if ($cvaTemplate !== null) {
            $defaults = $this->evaluateCvaFile($env, $context, $cvaTemplate);

            return $config === [] ? $defaults : array_replace_recursive($defaults, $config);
        }

        if ($config === []) {
            throw new RuntimeError(
                'vi_define_cva() needs a sibling .cva.twig, an explicit file path, or an inline slot config map.'
            );
        }

        // Inline full config (former vi_cva({…}))
        return $config;
    }

    /**
     * @param array<string, mixed>                $context
     * @param array<string, array<string, mixed>> $classes
     *
     * @return array<string, ViCvaSlot>
     */
    private function buildCvaMap(
        Environment $env,
        array &$context,
        array $classes,
        ?ComponentAttributes $attributes = null,
    ): array {
        $attributes ??= $context['attributes'] ?? null;

        if (!$attributes instanceof ComponentAttributes) {
            $attributes = new ComponentAttributes([], $env->getRuntime(EscaperRuntime::class));
            $context['attributes'] = $attributes;
        }

        $nestedExtras = [];
        $nestedClassKeys = [];

        foreach ($classes as $slot => $config) {
            if (!\is_array($config) || $slot === 'root') {
                continue;
            }

            $slotName = (string) $slot;
            $nestedExtras[$slotName] = $attributes->nested($slotName)->render('class');
            $nestedClassKeys[] = $slotName . ':class';
        }

        if ($nestedClassKeys !== []) {
            $attributes = $attributes->without(...$nestedClassKeys);
        }

        $map = [];

        foreach ($classes as $slot => $config) {
            if (!\is_array($config)) {
                continue;
            }

            $slotName = (string) $slot;

            $cva = new Cva(
                $config['base'] ?? '',
                $config['variants'] ?? [],
                $config['compoundVariants'] ?? [],
                $config['defaultVariants'] ?? [],
            );

            $extraClass = $slotName === 'root'
                ? $attributes->render('class')
                : ($nestedExtras[$slotName] ?? null);

            $map[$slotName] = new ViCvaSlot($cva, $extraClass);
        }

        if (isset($map['root'])) {
            $attributes = $attributes->without('class');
        }

        $context['attributes'] = $attributes;

        return $map;
    }

    /**
     * @param array<string, mixed>         $context
     * @param array<string, ViCvaSlot>     $map
     * @param list<string>|null            $exportSlots
     */
    private function exportClassSlots(array &$context, array $map, ?array $exportSlots): void
    {
        if ($exportSlots === null) {
            $exported = $map;
        } else {
            $exported = [];
            foreach ($exportSlots as $name) {
                if ($name !== '' && isset($map[$name])) {
                    $exported[$name] = $map[$name];
                }
            }
        }

        // Merge so sw_extends children can add slots without wiping the parent template
        $prev = $context[self::CTX_CLASSES] ?? [];
        if (!\is_array($prev)) {
            $prev = [];
        }
        $merged = array_merge($prev, $exported);
        $context[self::CTX_CLASSES] = $merged;
        $this->storeOnCurrentComponent(self::META_CLASSES, $merged, true);
    }

    /**
     * @param array<string, mixed> $value
     */
    private function storeOnCurrentComponent(string $key, array $value, bool $merge = false): void
    {
        $mounted = $this->componentStack?->getCurrentComponent();
        if ($mounted === null) {
            return;
        }

        if ($merge && $mounted->hasExtraMetadata($key)) {
            $prev = $mounted->getExtraMetadata($key);
            if (\is_array($prev)) {
                $value = array_merge($prev, $value);
            }
        }

        $mounted->addExtraMetadata($key, $value);
    }

    private function resolveFromStack(string $metaKey, string $slot): mixed
    {
        if ($this->componentStack === null) {
            return null;
        }

        foreach ($this->componentStack as $mounted) {
            if (!$mounted->hasExtraMetadata($metaKey)) {
                continue;
            }

            $map = $mounted->getExtraMetadata($metaKey);
            if (!\is_array($map)) {
                continue;
            }

            $value = $map[$slot] ?? null;
            if ($value !== null) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $context
     * @param list<string>         $mapKeys
     */
    private function resolveFromContextMaps(array $context, array $mapKeys, string $slot): mixed
    {
        $scope = $context;
        $seen = 0;

        while (\is_array($scope) && $seen < 32) {
            ++$seen;

            foreach ($mapKeys as $mapKey) {
                $map = $scope[$mapKey] ?? null;
                if (!\is_array($map)) {
                    continue;
                }

                $value = $map[$slot] ?? null;
                if ($value !== null) {
                    return $value;
                }
            }

            $outer = $scope['outerScope'] ?? null;
            if (!\is_array($outer) || $outer === $scope) {
                break;
            }
            $scope = $outer;
        }

        return null;
    }

    private function normalizeCvaTemplateRef(string $templateRef): string
    {
        if (str_ends_with($templateRef, self::CVA_FILE_SUFFIX)) {
            return $templateRef;
        }

        if (str_ends_with($templateRef, self::HTML_TWIG_SUFFIX)) {
            return $this->htmlTemplateToCvaTemplate($templateRef);
        }

        $path = ltrim(str_replace(':', '/', $templateRef), '/');

        if (!str_starts_with($path, '@') && !str_starts_with($path, 'components/')) {
            $path = '@ViewsTheme/components/' . $path;
        }

        if (!str_ends_with($path, self::CVA_FILE_SUFFIX)) {
            $path .= self::CVA_FILE_SUFFIX;
        }

        return $path;
    }

    private function htmlTemplateToCvaTemplate(string $htmlTemplate): string
    {
        if (str_ends_with($htmlTemplate, self::HTML_TWIG_SUFFIX)) {
            return substr($htmlTemplate, 0, -\strlen(self::HTML_TWIG_SUFFIX)) . self::CVA_FILE_SUFFIX;
        }

        return $htmlTemplate . self::CVA_FILE_SUFFIX;
    }

    private function resolveCallerHtmlTemplate(): ?string
    {
        if ($this->componentStack !== null && $this->componentFactory !== null) {
            $mounted = $this->componentStack->getCurrentComponent();
            if ($mounted !== null) {
                try {
                    $template = $this->componentFactory->metadataFor($mounted->getName())->getTemplate();
                    if (\is_string($template) && $template !== '') {
                        return $template;
                    }
                } catch (\Throwable) {
                    // fall through to backtrace
                }
            }
        }

        foreach (debug_backtrace(\DEBUG_BACKTRACE_PROVIDE_OBJECT) as $frame) {
            $object = $frame['object'] ?? null;
            if (!$object instanceof Template) {
                continue;
            }
            $name = $object->getTemplateName();
            if (!\is_string($name) || $name === '' || str_contains($name, 'string template')) {
                continue;
            }
            // Prefer component HTML templates over nested CVA eval wrappers
            if (str_ends_with($name, self::CVA_FILE_SUFFIX)) {
                continue;
            }

            return $name;
        }

        return null;
    }

    /**
     * @param array<string, mixed> $context
     *
     * @return array<string, array<string, mixed>>
     */
    private function evaluateCvaFile(Environment $env, array $context, string $cvaTemplate): array
    {
        $loader = $env->getLoader();

        if (!$loader->exists($cvaTemplate)) {
            throw new RuntimeError(\sprintf('CVA file "%s" not found.', $cvaTemplate));
        }

        $source = $loader->getSourceContext($cvaTemplate);
        $expression = $this->normalizeCvaSource($source->getCode());

        if ($expression === '') {
            throw new RuntimeError(\sprintf('CVA file "%s" is empty.', $cvaTemplate), -1, $source);
        }

        $wrapper = '{% set __vi_cva_config = ' . $expression . " %}\n{{- __vi_cva_export(__vi_cva_config) -}}";
        $stackDepth = \count($this->cvaExportStack);

        try {
            $env->createTemplate($wrapper, $cvaTemplate)->render($context);
        } catch (RuntimeError $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new RuntimeError(
                \sprintf('Failed to evaluate CVA file "%s": %s', $cvaTemplate, $e->getMessage()),
                -1,
                $source,
                $e,
            );
        }

        if (\count($this->cvaExportStack) <= $stackDepth) {
            throw new RuntimeError(
                \sprintf('CVA file "%s" did not export a config array.', $cvaTemplate),
                -1,
                $source,
            );
        }

        $config = array_pop($this->cvaExportStack);

        if (!\is_array($config)) {
            throw new RuntimeError(
                \sprintf('CVA file "%s" must evaluate to a hash/array.', $cvaTemplate),
                -1,
                $source,
            );
        }

        /** @var array<string, array<string, mixed>> $config */
        return $config;
    }

    private function normalizeCvaSource(string $code): string
    {
        $code = preg_replace('/\{#.*?#\}/s', '', $code) ?? $code;

        return trim($code);
    }
}
