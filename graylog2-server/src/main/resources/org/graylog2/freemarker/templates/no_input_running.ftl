<#if _title>
There is a node without any running inputs
</#if>

<#if _description>
<span>
There is a node without any running inputs. This means that you are not receiving any messages from this
node at this point in time. This is most probably an indication of an error or misconfiguration.
    <#if _cloud == false>
         You can click <a href="${SYSTEM_INPUTS}">here</a> to solve this.
    </#if>
</span>
</#if>
