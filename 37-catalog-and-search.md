# Sabi Shop --- Product Catalog & Search Specification

**Phase:** 5 --- Product Experience\
**Status:** Working Specification

## 1. Purpose

Make large SKU catalogues fast to navigate without weakening inventory
truth.

## 2. Product Identity

A product is a reusable catalogue entity with a stable SKU/product
identity. Historical transactions retain the product attribution
required for reconstruction.

## 3. Search

Search should support practical shop terminology, including: - product
name; - SKU/reference; - common aliases where configured; - model/part
identifiers; - relevant descriptive fields.

## 4. Search UX

The user should be able to: 1. start typing immediately; 2. see useful
matches quickly; 3. distinguish similar products; 4. inspect enough
identifying information before selection; 5. return to the current task
without losing progress.

## 5. Sale Context

Search results in POS should prioritize speed and stock relevance. Deep
inventory investigation belongs in the inventory domain.

## 6. Product States

Products may be: - active; - inactive/discontinued; - unavailable for
sale; - missing/under investigation.

Historical references must remain readable.

## 7. Inventory Visibility

Current stock may be shown where authorized. Cost information is
restricted according to permissions.

## 8. Future Barcode Support

The product-selection architecture should permit later barcode support
without requiring a redesign of the underlying product model.

## 9. Integrity

Changing a product's current descriptive information must not rewrite
historical sale-item identity or historical cost.
