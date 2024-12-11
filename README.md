# ns-bom-costing
A Suitelet utility for comparing Set/Average/Last cost of Assembly Items in NetSuite ERP.

![costedBOMexample](https://github.com/user-attachments/assets/31810b38-1934-48d5-a251-90b4156ddf9b)

Do you utilize NetSuite ERP?
Do you manufacture items or utilize assemblies?
Do you struggle to compare costing on these assemblies? 
Maybe you have an assembly that has never been built but need to cost it?

This is the tool for you. Input the Bill of Material Revision name you want and hit GET COST! You will receive 3 totals:
  Set Cost: This is the expected cost of the assembly based on what your company sets manually for each material.
  Average Cost: This is the cost of the assembly based on NetSuite's calculated cost, and will post to the GL when built. 
  Last Purchase Price: This is what the assembly would cost if going by the "Last Purchase Price" of each material.

We often find issues with the Set Cost being too high or too low, or find a calculation issue with the Average Cost using this tool.
We are also able to create customer facing price books without ever having to assemble them.

Majority credit goes to Tim Dietrich for the Suitelet setup, and Scott Danesi for the SuiteQL query.
I have compiled this into a slightly different tool to fit our needs, and you should do the same. 
