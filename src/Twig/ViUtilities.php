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
            new TwigFunction('vi_cva', [$this, 'cvaMap'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            new TwigFunction('vi_cva_from_file', [$this, 'cvaFromFile'], [
                'needs_context' => true,
                'needs_environment' => true,
            ]),
            // Internal: used while evaluating sibling `.cva.twig` expression files.
            new TwigFunction('__vi_cva_export', [$this, 'exportCvaConfig']),
        ];
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
     * Load sibling `Name.cva.twig` (or an explicit path), merge caller overrides, bind attributes.
     *
     * `.cva.twig` files are a single Twig hash expression (optional `{# comments #}` allowed),
     * evaluated with the component context so dynamic bases (`~ layout`) work.
     *
     * @param array<string, mixed>                $context
     * @param array<string, array<string, mixed>> $cva
     *
     * @return array<string, ViCvaSlot>
     */
    public function cvaFromFile(
        Environment $env,
        array &$context,
        array $cva = [],
        ComponentAttributes|string|null $templateOrAttributes = null,
        ?ComponentAttributes $attributes = null,
    ): array {
        $templateRef = null;

        if (\is_string($templateOrAttributes)) {
            $templateRef = $templateOrAttributes;
        } elseif ($templateOrAttributes instanceof ComponentAttributes) {
            $attributes = $templateOrAttributes;
        }

        $cvaTemplate = $this->resolveCvaTemplate($env, $templateRef);
        $defaults = $this->evaluateCvaFile($env, $context, $cvaTemplate);
        $classes = $cva === [] ? $defaults : array_replace_recursive($defaults, $cva);

        return $this->cvaMap($env, $context, $classes, $attributes);
    }

    /**
     * Build CVA slots from a classes map, binding attribute class extras.
     *
     * - root → attributes.render('class')
     * - other keys → attributes.nested(key).render('class'), then strip "slot:class" from attributes
     *
     * When called outside a UX component (e.g. renderView / sw_include), an empty
     * ComponentAttributes bag is created so class maps still resolve.
     *
     * @param array<string, mixed>                $context
     * @param array<string, array<string, mixed>> $classes
     *
     * @return array<string, ViCvaSlot>
     */
    public function cvaMap(
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

        $context['attributes'] = $attributes;

        return $map;
    }

    private function resolveCvaTemplate(Environment $env, ?string $templateRef): string
    {
        if ($templateRef !== null && $templateRef !== '') {
            return $this->normalizeCvaTemplateRef($templateRef);
        }

        $htmlTemplate = $this->resolveCallerHtmlTemplate();
        if ($htmlTemplate === null) {
            throw new RuntimeError(
                'vi_cva_from_file() could not resolve the caller template. '
                . 'Pass an explicit path, e.g. vi_cva_from_file(cva, \'@ViewsTheme/components/Alert.cva.twig\').'
            );
        }

        $cvaTemplate = $this->htmlTemplateToCvaTemplate($htmlTemplate);

        if (!$env->getLoader()->exists($cvaTemplate)) {
            throw new RuntimeError(\sprintf(
                'CVA file "%s" not found (sibling of "%s").',
                $cvaTemplate,
                $htmlTemplate,
            ));
        }

        return $cvaTemplate;
    }

    private function normalizeCvaTemplateRef(string $templateRef): string
    {
        if (str_ends_with($templateRef, self::CVA_FILE_SUFFIX)) {
            return $templateRef;
        }

        if (str_ends_with($templateRef, self::HTML_TWIG_SUFFIX)) {
            return $this->htmlTemplateToCvaTemplate($templateRef);
        }

        // Bare component path: "Alert" / "Product/Box/Default" / "ViewsTheme:Alert"
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

        foreach (debug_backtrace(\DEBUG_BACKTRACE_IGNORE_ARGS) as $frame) {
            $object = $frame['object'] ?? null;
            if ($object instanceof Template) {
                $name = $object->getTemplateName();
                if (\is_string($name) && $name !== '' && !str_contains($name, 'string template')) {
                    return $name;
                }
            }
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
